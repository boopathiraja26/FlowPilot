import { GoogleGenAI } from "@google/genai";
import { Prisma, Workflow, WorkflowStep } from "@prisma/client";
import prisma from "../lib/prisma";

import { env } from "../config/env";
import { ApiError } from "../middleware/errorHandler";
import {
  GeneratedWorkflow,
  GenerateWorkflowInput,
  generatedWorkflowSchema,
} from "../validators/ai.validation";

// =========================================================
// Client setup
// =========================================================

const GEMINI_API_KEY = env.gemini.apiKey;
const GEMINI_MODEL = env.gemini.model;
const GEMINI_FALLBACK_MODELS = Array.from(
  new Set(
    (env.gemini.fallbackModels ?? [])
      .map((m) => m.trim())
      .filter((m) => m && m !== GEMINI_MODEL)
  )
);
const AI_GENERATION_TIMEOUT_MS =
  Number.isFinite(env.gemini.timeoutMs) && env.gemini.timeoutMs > 0
    ? env.gemini.timeoutMs
    : 30_000;

if (!GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[ai.service] Missing GEMINI_API_KEY environment variable");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// =========================================================
// Provider error handling (safe diagnostics, no secrets)
// =========================================================

type ProviderCauseCategory =
  | "authentication"
  | "quota"
  | "model_availability"
  | "provider_unavailable"
  | "network"
  | "timeout"
  | "application"
  | "unknown";

type SafeProviderError = {
  provider: "gemini";
  model: string;
  httpStatus?: number;
  errorCode?: string | number;
  safeMessage: string;
  causeCategory: ProviderCauseCategory;
};

const AI_PROVIDER_MAX_ATTEMPTS = 3;
const AI_PROVIDER_BASE_DELAY_MS = 500;
const AI_PROVIDER_MAX_DELAY_MS = 10_000;
const AI_PROVIDER_MIN_RETRY_DELAY_MS = 100;
const BUDGET_ABORT_REASON = "ai_generation_budget_exceeded";

const fallbackModelAvailabilityCache = new Map<string, boolean>();

export interface GenerateWorkflowOptions {
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  now?: () => number;
  timeoutMs?: number;
}

function redactSecrets(value: string): string {
  let safe = value;
  if (GEMINI_API_KEY) {
    safe = safe.split(GEMINI_API_KEY).join("[REDACTED]");
  }
  safe = safe.replace(/AIza[0-9A-Za-z_\-]{10,}/g, "[REDACTED_API_KEY]");
  return safe;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function classifyProviderCause(
  httpStatus: number | undefined,
  code: string | undefined,
  message: string,
  timedOut = false
): ProviderCauseCategory {
  const text = `${code ?? ""} ${message}`.toLowerCase();

  if (timedOut || code === "AI_TIMEOUT" || text.includes("budget") && text.includes("timeout")) {
    return "timeout";
  }

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    text.includes("api key") ||
    text.includes("unauth") ||
    text.includes("permission denied") ||
    code === "PERMISSION_DENIED" ||
    code === "UNAUTHENTICATED"
  ) {
    return "authentication";
  }

  if (httpStatus === 503 || code === "UNAVAILABLE") {
    return "provider_unavailable";
  }

  if (
    httpStatus === 429 ||
    text.includes("quota") ||
    text.includes("rate limit") ||
    text.includes("resource exhausted") ||
    code === "RESOURCE_EXHAUSTED"
  ) {
    return "quota";
  }

  if (
    httpStatus === 404 ||
    (text.includes("model") &&
      (text.includes("not found") ||
        text.includes("unsupported") ||
        text.includes("unknown") ||
        text.includes("does not exist") ||
        text.includes("unavailable"))) ||
    code === "NOT_FOUND"
  ) {
    return "model_availability";
  }

  if (
    httpStatus === undefined ||
    text.includes("fetch failed") ||
    text.includes("network") ||
    text.includes("econn") ||
    text.includes("enotfound") ||
    text.includes("etimedout") ||
    text.includes("econnreset") ||
    text.includes("eai_again") ||
    text.includes("timeout") ||
    text.includes("timed out") ||
    text.includes("socket") ||
    text.includes("aborted") ||
    text.includes("abort")
  ) {
    return "network";
  }

  if (httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
    return "application";
  }

  return "unknown";
}

function getHeaderValue(headers: unknown, name: string): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  if (typeof (headers as { get?: unknown }).get === "function") {
    try {
      const value =
        (headers as { get: (n: string) => unknown }).get(name) ??
        (headers as { get: (n: string) => unknown }).get(lower);
      return typeof value === "string" ? value : undefined;
    } catch {
      return undefined;
    }
  }
  const record = asRecord(headers);
  if (!record) return undefined;
  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() !== lower) continue;
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return undefined;
}

function getRetryAfterMs(err: unknown): number | undefined {
  const record = asRecord(err);
  const nested = asRecord(record?.error);
  const cause = asRecord(record?.cause);
  const response =
    asRecord(record?.response) ??
    asRecord(cause?.response) ??
    asRecord(nested?.response);
  const headerSources = [record?.headers, nested?.headers, cause?.headers, response?.headers];

  let retryAfter: string | undefined;
  for (const source of headerSources) {
    retryAfter = getHeaderValue(source, "retry-after");
    if (retryAfter) break;
  }
  if (!retryAfter) return undefined;

  const trimmed = retryAfter.trim();
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, AI_PROVIDER_MAX_DELAY_MS);
  }

  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    if (delta > 0) return Math.min(delta, AI_PROVIDER_MAX_DELAY_MS);
  }

  return undefined;
}

function getSafeProviderError(err: unknown, model: string): SafeProviderError {
  const record = asRecord(err);
  const nested = asRecord(record?.error);
  const cause = asRecord(record?.cause);

  const statusCandidate =
    (typeof record?.status === "number" ? record.status : undefined) ??
    (typeof record?.statusCode === "number" ? record.statusCode : undefined) ??
    (typeof record?.code === "number" ? record.code : undefined) ??
    (typeof nested?.code === "number" ? nested.code : undefined) ??
    (typeof nested?.status === "number" ? nested.status : undefined) ??
    (typeof cause?.status === "number" ? cause.status : undefined);

  const errorCodeCandidate =
    (typeof nested?.status === "string" ? nested.status : undefined) ??
    (typeof nested?.code === "string" ? nested.code : undefined) ??
    (typeof record?.code === "string" ? record.code : undefined) ??
    (typeof record?.name === "string" ? record.name : undefined);

  const rawMessage =
    (typeof nested?.message === "string" ? nested.message : undefined) ??
    (typeof record?.message === "string" ? record.message : undefined) ??
    (err instanceof Error ? err.message : undefined) ??
    "Unknown AI provider error";

  const safeMessage = redactSecrets(rawMessage).slice(0, 500);
  const errorCode =
    errorCodeCandidate ??
    (typeof statusCandidate === "number" ? statusCandidate : undefined);
  const httpStatus = typeof statusCandidate === "number" ? statusCandidate : undefined;

  return {
    provider: "gemini",
    model,
    httpStatus,
    errorCode,
    safeMessage,
    causeCategory: classifyProviderCause(httpStatus, errorCodeCandidate, safeMessage),
  };
}

function isNonRetryableProviderStatus(status: number | undefined): boolean {
  return status === 400 || status === 401 || status === 403 || status === 404;
}

function isTransientProviderError(providerError: SafeProviderError): boolean {
  const status = providerError.httpStatus;
  if (isNonRetryableProviderStatus(status)) return false;
  if (status === 503 || status === 429) return true;
  return (
    providerError.causeCategory === "network" ||
    providerError.causeCategory === "timeout"
  );
}

function shouldConsiderFallback(providerError: SafeProviderError): boolean {
  const status = providerError.httpStatus;
  if (isNonRetryableProviderStatus(status)) return false;
  return (
    providerError.causeCategory === "provider_unavailable" ||
    providerError.causeCategory === "network" ||
    providerError.causeCategory === "timeout" ||
    providerError.causeCategory === "quota" ||
    providerError.causeCategory === "unknown" ||
    status === 503 ||
    status === 429
  );
}

function isBudgetExceededError(err: unknown): boolean {
  if (!err) return false;
  if (err === BUDGET_ABORT_REASON) return true;
  const record = asRecord(err);
  const name = typeof record?.name === "string" ? record.name : err instanceof Error ? err.name : "";
  const message = typeof record?.message === "string" ? record.message : err instanceof Error ? err.message : String(err);
  const cause = record?.cause;
  return (
    message === BUDGET_ABORT_REASON ||
    cause === BUDGET_ABORT_REASON ||
    (name === "AbortError" && /budget|timeout|exceeded/i.test(message))
  );
}

function createTimeoutError(timeoutMs: number): Error & { status?: number; code?: string } {
  const err = new Error(`AI generation timed out after ${timeoutMs}ms`) as Error & {
    status?: number;
    code?: string;
  };
  err.name = "AITimeoutError";
  err.code = "AI_TIMEOUT";
  err.status = 504;
  return err;
}

function computeRetryDelayMs(
  attempt: number,
  err: unknown,
  random: () => number
): number {
  const retryAfterMs = getRetryAfterMs(err);
  if (retryAfterMs !== undefined) return retryAfterMs;
  const exp = Math.min(
    AI_PROVIDER_MAX_DELAY_MS,
    AI_PROVIDER_BASE_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1))
  );
  const jitter = Math.floor(exp * 0.25 * Math.min(1, Math.max(0, random())));
  return Math.min(AI_PROVIDER_MAX_DELAY_MS, exp + jitter);
}

function getUserFriendlyFailureMessage(
  providerError: SafeProviderError,
  timedOut: boolean
): string {
  if (timedOut || providerError.causeCategory === "timeout") {
    return "AI workflow generation timed out before it could complete. Please try again.";
  }
  if (
    providerError.causeCategory === "provider_unavailable" ||
    providerError.httpStatus === 503
  ) {
    return "AI workflow generation is temporarily unavailable due to high demand. Please try again in a moment.";
  }
  if (providerError.causeCategory === "network") {
    return "AI workflow generation could not reach the AI provider. Please check your connection and try again.";
  }
  if (providerError.causeCategory === "quota" || providerError.httpStatus === 429) {
    return "AI workflow generation is temporarily rate-limited. Please try again shortly.";
  }
  if (providerError.causeCategory === "authentication") {
    return "AI workflow generation is not authorized with the configured provider credentials.";
  }
  if (providerError.causeCategory === "model_availability") {
    return "The configured AI model is not available. Please check the AI model configuration.";
  }
  if (providerError.causeCategory === "application") {
    return "AI workflow generation failed due to an invalid provider request.";
  }
  return "AI workflow generation failed. Please try again.";
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sleepWithBudget(
  ms: number,
  sleep: (ms: number) => Promise<void>,
  deadline: number,
  now: () => number
): Promise<void> {
  if (ms <= 0) return;
  const remaining = deadline - now();
  if (remaining <= 0) {
    throw createTimeoutError(0);
  }
  await sleep(Math.min(ms, remaining));
}

async function verifyFallbackModelAvailability(
  model: string,
  deadline: number,
  now: () => number
): Promise<boolean> {
  if (fallbackModelAvailabilityCache.has(model)) {
    return fallbackModelAvailabilityCache.get(model) === true;
  }

  const remaining = deadline - now();
  if (remaining <= 0) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(BUDGET_ABORT_REASON), remaining);

  try {
    await (ai.models as unknown as { get: (params: any) => Promise<unknown> }).get({
      model,
      config: { httpOptions: { abortSignal: controller.signal, timeout: remaining } },
    } as any);
    fallbackModelAvailabilityCache.set(model, true);
    return true;
  } catch (err) {
    if (isBudgetExceededError(err) || controller.signal.aborted) {
      return false;
    }
    const safe = getSafeProviderError(err, model);
    if (
      safe.causeCategory === "model_availability" ||
      safe.httpStatus === 404
    ) {
      fallbackModelAvailabilityCache.set(model, false);
    }
    // eslint-disable-next-line no-console
    console.warn("[ai.service] Fallback model verification failed or unavailable (safe):", {
      model,
      httpStatus: safe.httpStatus,
      errorCode: safe.errorCode,
      causeCategory: safe.causeCategory,
      safeMessage: safe.safeMessage,
    });
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function callGenerateContentWithBudget(
  model: string,
  prompt: string,
  deadline: number,
  now: () => number,
  timeoutMs: number
): Promise<unknown> {
  const remaining = deadline - now();
  if (remaining <= 0) {
    throw createTimeoutError(timeoutMs);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(BUDGET_ABORT_REASON), remaining);

  try {
    const response = await (ai.models.generateContent as (params: any) => Promise<unknown>)({
      model,
      contents: buildPrompt(prompt),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.4,
        httpOptions: {
          abortSignal: controller.signal,
          timeout: remaining,
        },
      },
    } as any);
    return response;
  } catch (err) {
    // Treat aborts triggered by our budget timer as timeouts even if the injected clock
    // hasn't advanced (real timers/SDK aborts are independent of test clocks).
    if (isBudgetExceededError(err) || controller.signal.aborted) {
      throw createTimeoutError(timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// =========================================================
// Prompt construction
// =========================================================

const SYSTEM_INSTRUCTION = `You are FlowPilot's workflow generation engine.
Given a user's natural language request, design an automation workflow.

You MUST respond with ONLY valid JSON. No markdown, no code fences, no commentary.

The JSON MUST match this exact shape:
{
  "title": string,
  "description": string | null,
  "steps": [
    {
      "order": number (starting at 1, sequential),
      "type": "TRIGGER" | "AI" | "EMAIL" | "DELAY" | "WEBHOOK",
      "name": string,
      "config": object
    }
  ]
}

Rules:
- The first step must be of type "TRIGGER".
- Use only the allowed step types listed above.
- "config" must be a plain JSON object relevant to the step type
  (e.g. EMAIL steps include "to"/"subject"/"body" style fields,
  DELAY steps include a duration field, WEBHOOK steps include a "url" field).
- Keep step names short and action-oriented.
- Do not include any fields other than title, description, and steps.`;

function buildPrompt(userPrompt: string): string {
  return `User request: "${userPrompt}"\n\nGenerate the workflow JSON now.`;
}

// =========================================================
// Response parsing
// =========================================================

function extractJsonText(rawText: string): string {
  const trimmed = rawText.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return trimmed;
}

function parseGeneratedWorkflow(rawText: string): GeneratedWorkflow {
  const jsonText = extractJsonText(rawText);

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(jsonText);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[ai.service] Failed to JSON.parse Gemini response:", jsonText, err);
    throw new ApiError(502, "AI response was not valid JSON");
  }

  const result = generatedWorkflowSchema.safeParse(parsedJson);

  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error(
      "[ai.service] Gemini response failed schema validation:",
      result.error.flatten().fieldErrors
    );
    throw new ApiError(
      502,
      "AI response did not match the expected workflow structure",
      result.error.flatten().fieldErrors
    );
  }

  return result.data;
}

// =========================================================
// generateWorkflowFromPrompt
// =========================================================

export async function generateWorkflowFromPrompt(
  input: GenerateWorkflowInput,
  options: GenerateWorkflowOptions = {}
): Promise<GeneratedWorkflow> {
  if (!GEMINI_API_KEY) {
    throw new ApiError(500, "AI generation is not configured on this server");
  }

  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;
  const now = options.now ?? Date.now;
  const timeoutMs =
    typeof options.timeoutMs === "number" && options.timeoutMs > 0
      ? options.timeoutMs
      : AI_GENERATION_TIMEOUT_MS;

  const start = now();
  const deadline = start + timeoutMs;

  let totalAttempts = 0;
  let modelIndex = 0;
  let currentModel = GEMINI_MODEL;
  let lastProviderError: (SafeProviderError & { attemptsUsed?: number; totalBudgetMs?: number; timedOut?: boolean }) | null = null;

  while (true) {
    if (now() >= deadline) {
      const timedOutError = getSafeProviderError(createTimeoutError(timeoutMs), currentModel);
      timedOutError.causeCategory = "timeout";
      timedOutError.httpStatus = 504;
      timedOutError.errorCode = "AI_TIMEOUT";
      lastProviderError = { ...timedOutError, attemptsUsed: totalAttempts, totalBudgetMs: timeoutMs, timedOut: true };
      break;
    }

    if (totalAttempts >= AI_PROVIDER_MAX_ATTEMPTS) {
      break;
    }

    totalAttempts += 1;
    const attemptForCurrentModel = totalAttempts; // bounded globally to avoid excessive requests/cost

    try {
      const response = await callGenerateContentWithBudget(
        currentModel,
        input.prompt,
        deadline,
        now,
        timeoutMs
      );

      const rawText = (asRecord(response)?.text as string | undefined) ??
        ((response as { text?: string } | null | undefined)?.text);

      if (!rawText) {
        throw new ApiError(502, "AI provider returned an empty response");
      }

      const workflow = parseGeneratedWorkflow(rawText);

      const normalizedSteps = [...workflow.steps]
        .sort((a, b) => a.order - b.order)
        .map((step, index) => ({
          ...step,
          order: index + 1,
        }));

      return {
        ...workflow,
        steps: normalizedSteps,
      };
    } catch (err) {
      if (err instanceof ApiError) {
        // Preserve explicit non-provider failures (e.g. empty response, parse/schema issues)
        throw err;
      }

      const budgetTimedOut =
        isBudgetExceededError(err) ||
        (err as { code?: string } | null)?.code === "AI_TIMEOUT";
      const providerError = budgetTimedOut
        ? (() => {
            const safe = getSafeProviderError(createTimeoutError(timeoutMs), currentModel);
            safe.causeCategory = "timeout";
            safe.httpStatus = 504;
            safe.errorCode = "AI_TIMEOUT";
            safe.safeMessage = `AI generation timed out after ${timeoutMs}ms`;
            return safe;
          })()
        : getSafeProviderError(err, currentModel);

      const retryable = !budgetTimedOut && isTransientProviderError(providerError);
      const attemptsRemaining = AI_PROVIDER_MAX_ATTEMPTS - totalAttempts;
      const canRetrySameModel = retryable && attemptsRemaining > 0 && now() < deadline;

      // Prefer a verified fallback model for provider/model overload or availability issues
      // when one is configured; this uses remaining attempts within the same total budget.
      const preferFallbackBeforeRetry =
        shouldConsiderFallback(providerError) || budgetTimedOut;

      let canRetry = canRetrySameModel;
      if (canRetrySameModel && preferFallbackBeforeRetry && modelIndex < GEMINI_FALLBACK_MODELS.length) {
        canRetry = false;
      }

      // eslint-disable-next-line no-console
      console.error("[ai.service] Gemini API call failed (safe):", {
        ...providerError,
        attempt: totalAttempts,
        maxAttempts: AI_PROVIDER_MAX_ATTEMPTS,
        retryable,
        willRetry: canRetry || (attemptsRemaining > 0 && now() < deadline && (preferFallbackBeforeRetry || canRetrySameModel)),
        timedOut: budgetTimedOut,
        totalBudgetMs: timeoutMs,
      });

      lastProviderError = {
        ...providerError,
        attemptsUsed: totalAttempts,
        totalBudgetMs: timeoutMs,
        timedOut: budgetTimedOut,
      };

      // Optional fallback model support: only use a model verified as available for the configured API key.
      const canTryFallback =
        attemptsRemaining > 0 &&
        now() < deadline &&
        (preferFallbackBeforeRetry || (!canRetrySameModel && shouldConsiderFallback(providerError)));

      let switchedToFallback = false;
      if (canTryFallback) {
        while (modelIndex < GEMINI_FALLBACK_MODELS.length) {
          const candidate = GEMINI_FALLBACK_MODELS[modelIndex++];
          const available = await verifyFallbackModelAvailability(
            candidate,
            deadline,
            now
          );
          if (!available) {
            continue;
          }
          if (now() >= deadline) {
            lastProviderError = {
              ...getSafeProviderError(createTimeoutError(timeoutMs), candidate),
              causeCategory: "timeout",
              httpStatus: 504,
              errorCode: "AI_TIMEOUT",
              safeMessage: `AI generation timed out after ${timeoutMs}ms`,
              attemptsUsed: totalAttempts,
              totalBudgetMs: timeoutMs,
              timedOut: true,
            };
            switchedToFallback = false;
            break;
          }
          // eslint-disable-next-line no-console
          console.warn("[ai.service] Switching to verified fallback Gemini model (safe):", {
            fromModel: currentModel,
            toModel: candidate,
            attempt: totalAttempts,
            maxAttempts: AI_PROVIDER_MAX_ATTEMPTS,
            remainingAttempts: attemptsRemaining,
          });
          currentModel = candidate;
          switchedToFallback = true;
          lastProviderError = {
            ...providerError,
            attemptsUsed: totalAttempts,
            totalBudgetMs: timeoutMs,
            timedOut: budgetTimedOut,
          };
          break;
        }
      }

      // If a verified fallback model is selected, consume remaining budget/attempts on it.
      if (switchedToFallback) {
        continue;
      }

      if (canRetrySameModel) {
        let delayMs = computeRetryDelayMs(attemptForCurrentModel, err, random);
        delayMs = Math.max(AI_PROVIDER_MIN_RETRY_DELAY_MS, delayMs);
        const remaining = deadline - now();
        if (remaining <= AI_PROVIDER_MIN_RETRY_DELAY_MS) {
          // no budget left for a meaningful retry
        } else {
          delayMs = Math.min(delayMs, Math.max(0, remaining - 1));
          // eslint-disable-next-line no-console
          console.warn("[ai.service] Retrying Gemini request after transient error (safe):", {
            provider: providerError.provider,
            model: currentModel,
            httpStatus: providerError.httpStatus,
            causeCategory: providerError.causeCategory,
            attempt: totalAttempts,
            nextAttempt: totalAttempts + 1,
            delayMs,
          });
          try {
            await sleepWithBudget(delayMs, sleep, deadline, now);
          } catch {
            const timedOut = getSafeProviderError(createTimeoutError(timeoutMs), currentModel);
            timedOut.causeCategory = "timeout";
            timedOut.httpStatus = 504;
            timedOut.errorCode = "AI_TIMEOUT";
            timedOut.safeMessage = `AI generation timed out after ${timeoutMs}ms`;
            lastProviderError = { ...timedOut, attemptsUsed: totalAttempts, totalBudgetMs: timeoutMs, timedOut: true };
            break;
          }
          continue;
        }
      }

      break;
    }
  }

  const finalError: SafeProviderError & { attemptsUsed?: number; totalBudgetMs?: number; timedOut?: boolean } =
    lastProviderError ?? {
      provider: "gemini",
      model: currentModel,
      safeMessage: "AI workflow generation failed without a provider response.",
      causeCategory: "unknown",
      attemptsUsed: totalAttempts,
      totalBudgetMs: timeoutMs,
    };

  const timedOut = finalError.causeCategory === "timeout" || finalError.timedOut === true;
  const userMessage = getUserFriendlyFailureMessage(finalError, timedOut);

  throw new ApiError(502, userMessage, {
    ...finalError,
    model: finalError.model || currentModel,
    attemptsUsed: finalError.attemptsUsed ?? totalAttempts,
    totalBudgetMs: finalError.totalBudgetMs ?? timeoutMs,
  });
}

// =========================================================
// saveGeneratedWorkflow
// =========================================================

export interface SavedWorkflow extends Workflow {
  steps: WorkflowStep[];
}

export async function saveGeneratedWorkflow(
  userId: string,
  workflow: GeneratedWorkflow
): Promise<SavedWorkflow> {
  try {
    const savedWorkflow = await prisma.$transaction(async (tx) => {
      const createdWorkflow = await tx.workflow.create({
        data: {
          title: workflow.title,
          description: workflow.description ?? null,
          status: "DRAFT",
          userId,
        },
      });

      await tx.workflowStep.createMany({
        data: workflow.steps.map((step) => ({
          workflowId: createdWorkflow.id,
          stepOrder: step.order,
          type: step.type,
          name: step.name,
          config: step.config as Prisma.InputJsonValue,
        })),
      });

      const steps = await tx.workflowStep.findMany({
        where: { workflowId: createdWorkflow.id },
        orderBy: { stepOrder: "asc" },
      });

      return {
        ...createdWorkflow,
        steps,
      };
    });

    return savedWorkflow;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[ai.service] Failed to save generated workflow:", err);
    throw new ApiError(500, "Failed to save the generated workflow. Please try again.");
  }
}