import crypto from "crypto";

import { ApiError } from "../middleware/errorHandler";

export type TriggerMode = "manual" | "webhook";

export interface TriggerStepLike {
  id?: string;
  type: string;
  name?: string;
  config?: unknown;
  [key: string]: unknown;
}

export interface WorkflowLikeForTrigger {
  id?: string;
  status?: string;
  steps?: TriggerStepLike[];
  [key: string]: unknown;
}

export interface NormalizedTriggerConfig {
  triggerMode: TriggerMode;
  webhookSecret: string | null;
  event: string;
  raw: Record<string, unknown>;
}

export const WEBHOOK_SECRET_HEADER = "x-webhook-secret";
export const WEBHOOK_SECRET_REDACTED_PLACEHOLDER = "[REDACTED_WEBHOOK_SECRET]";

function asConfigObject(config: unknown): Record<string, unknown> {
  if (config && typeof config === "object" && !Array.isArray(config)) {
    return { ...(config as Record<string, unknown>) };
  }
  return {};
}

export function getTriggerStep(workflow: WorkflowLikeForTrigger): TriggerStepLike | null {
  const steps = workflow.steps ?? [];
  return steps.find((step) => step.type === "TRIGGER") ?? null;
}

export function normalizeTriggerConfig(config: unknown): NormalizedTriggerConfig {
  const raw = asConfigObject(config);
  const modeRaw = typeof raw.triggerMode === "string" ? raw.triggerMode.toLowerCase() : "";
  const legacyType = typeof raw.trigger_type === "string" ? raw.trigger_type.toLowerCase() : "";

  const triggerMode: TriggerMode =
    modeRaw === "webhook" || legacyType === "webhook" || legacyType === "incoming_webhook"
      ? "webhook"
      : "manual";

  const webhookSecret =
    typeof raw.webhookSecret === "string" && raw.webhookSecret.trim()
      ? raw.webhookSecret.trim()
      : typeof raw.webhook_secret === "string" && raw.webhook_secret.trim()
      ? raw.webhook_secret.trim()
      : null;

  const event =
    typeof raw.event === "string" && raw.event.trim()
      ? raw.event.trim()
      : "manual.trigger";

  return { triggerMode, webhookSecret, event, raw };
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function ensureWebhookSecret(config: unknown): Record<string, unknown> {
  const normalized = normalizeTriggerConfig(config);
  const raw: Record<string, unknown> = { ...normalized.raw, triggerMode: "webhook" };
  if (!normalized.webhookSecret) {
    raw.webhookSecret = generateWebhookSecret();
  } else {
    raw.webhookSecret = normalized.webhookSecret;
  }
  return raw;
}

export function validateTriggerConfiguration(
  workflow: WorkflowLikeForTrigger,
  options?: { requireForActivation?: boolean }
): { ok: true; triggerStep: TriggerStepLike; config: NormalizedTriggerConfig } | never {
  const triggerStep = getTriggerStep(workflow);
  if (!triggerStep) {
    throw new ApiError(400, "Workflow must include a TRIGGER step before activation.");
  }

  const config = normalizeTriggerConfig(triggerStep.config);

  if (config.triggerMode === "webhook") {
    if (!config.webhookSecret || config.webhookSecret.length < 16) {
      if (options?.requireForActivation) {
        throw new ApiError(
          400,
          "Webhook trigger requires a webhook secret. Configure the trigger step before activating."
        );
      }
    }
  }

  return { ok: true, triggerStep, config };
}

export function assertWorkflowCanActivate(workflow: WorkflowLikeForTrigger): void {
  const steps = workflow.steps ?? [];
  if (steps.length === 0) {
    throw new ApiError(400, "Workflow must have at least one step before activation.");
  }

  const { config } = validateTriggerConfiguration(workflow, { requireForActivation: true });

  if (config.triggerMode === "webhook" && (!config.webhookSecret || config.webhookSecret.length < 16)) {
    throw new ApiError(
      400,
      "Webhook trigger requires a secure webhook secret before activation."
    );
  }
}

export function isValidWebhookSecret(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

export function extractWebhookSecret(req: {
  headers?: Record<string, unknown>;
}): string | null {
  const headers = req.headers ?? {};
  const headerSecret = headers[WEBHOOK_SECRET_HEADER];
  if (typeof headerSecret === "string") {
    const trimmed = headerSecret.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(headerSecret) && typeof headerSecret[0] === "string") {
    const trimmed = headerSecret[0].trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

export function isRedactedWebhookSecret(value: unknown): boolean {
  return value === WEBHOOK_SECRET_REDACTED_PLACEHOLDER;
}

export function redactTriggerConfig(config: unknown): Record<string, unknown> {
  const normalized = normalizeTriggerConfig(config);
  const raw: Record<string, unknown> = { ...normalized.raw };
  if (normalized.webhookSecret) {
    raw.webhookSecret = WEBHOOK_SECRET_REDACTED_PLACEHOLDER;
  }
  if (typeof raw.webhook_secret === "string" && raw.webhook_secret.trim()) {
    raw.webhook_secret = WEBHOOK_SECRET_REDACTED_PLACEHOLDER;
  }
  return raw;
}

export function redactStepSecrets<T extends TriggerStepLike>(step: T): T {
  if (step.type !== "TRIGGER") {
    return step;
  }

  return {
    ...step,
    config: redactTriggerConfig(step.config),
  };
}

export function redactWorkflowSecrets<T extends WorkflowLikeForTrigger>(workflow: T): T {
  if (!Array.isArray(workflow.steps)) {
    return workflow;
  }

  return {
    ...workflow,
    steps: workflow.steps.map((step) => redactStepSecrets(step)),
  };
}

export function mergeTriggerConfigPreservingSecret(
  incomingConfig: unknown,
  existingConfig: unknown
): Record<string, unknown> | undefined {
  if (incomingConfig === undefined) {
    return undefined;
  }

  const incoming = asConfigObject(incomingConfig);
  const existing = asConfigObject(existingConfig);
  const incomingNormalized = normalizeTriggerConfig(incoming);
  const existingNormalized = normalizeTriggerConfig(existing);
  const merged: Record<string, unknown> = { ...incoming };

  const hasIncomingPlaceholder =
    isRedactedWebhookSecret(incoming.webhookSecret) || isRedactedWebhookSecret(incoming.webhook_secret);

  if (hasIncomingPlaceholder) {
    if (existingNormalized.webhookSecret) {
      merged.webhookSecret = existingNormalized.webhookSecret;
    } else {
      delete merged.webhookSecret;
    }
  } else if (typeof incomingNormalized.webhookSecret === "string") {
    merged.webhookSecret = incomingNormalized.webhookSecret;
  }

  if (isRedactedWebhookSecret(incoming.webhook_secret)) {
    if (existingNormalized.webhookSecret) {
      merged.webhook_secret = existingNormalized.webhookSecret;
    } else {
      delete merged.webhook_secret;
    }
  }

  return merged;
}
