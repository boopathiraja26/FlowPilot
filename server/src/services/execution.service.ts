import {
  ExecutionStatus,
  WorkflowExecution,
  WorkflowStep,
  WorkflowStepType,
} from "@prisma/client";

import prisma from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { generateAIResponse } from "./gemini.service";
import { sendEmail } from "./email.service";
import { executeWebhook } from "./webhook.service";
import { resolveTemplate, resolveObjectTemplates, renderWelcomeEmailHtml } from "../utils/template";
import { getTriggerStep, isValidWebhookSecret, normalizeTriggerConfig } from "../utils/workflow-trigger";

// =========================================================
// Get workflow with ownership + steps (manual authenticated execution)
// =========================================================

async function getWorkflowForExecution(
  workflowId: string,
  userId: string
) {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowId,
      userId,
    },
    include: {
      steps: {
        orderBy: {
          stepOrder: "asc",
        },
      },
    },
  });

  if (!workflow) {
    throw new ApiError(404, "Workflow not found");
  }

  return workflow;
}

// =========================================================
// Get workflow for incoming webhook trigger (public, token-validated)
// =========================================================

async function getWorkflowForIncomingWebhook(
  workflowId: string,
  providedSecret: string | null
) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  if (!workflow) {
    throw new ApiError(404, "Workflow not found");
  }

  if (workflow.status !== "ACTIVE") {
    throw new ApiError(403, "Workflow is not active");
  }

  const triggerStep = getTriggerStep(workflow);
  if (!triggerStep) {
    throw new ApiError(400, "Workflow has no trigger configured");
  }

  const triggerConfig = normalizeTriggerConfig(triggerStep.config);
  if (triggerConfig.triggerMode !== "webhook") {
    throw new ApiError(403, "Workflow is not configured for incoming webhook triggers");
  }

  if (!isValidWebhookSecret(providedSecret, triggerConfig.webhookSecret)) {
    throw new ApiError(401, "Invalid webhook secret");
  }

  return workflow;
}

// =========================================================
// Create execution
// =========================================================

async function createExecution(
  workflowId: string
): Promise<WorkflowExecution> {
  return prisma.workflowExecution.create({
    data: {
      workflowId,
      status: ExecutionStatus.RUNNING,
    },
  });
}

// =========================================================
// Log execution step
// =========================================================

async function createExecutionLog(
  executionId: string,
  step: {
    id: string;
    name: string;
    type: WorkflowStepType;
  },
  status: ExecutionStatus,
  message?: string,
  startedAt: Date = new Date(),
  completedAt: Date | null = status === ExecutionStatus.RUNNING ? null : startedAt
) {
  const logClient = (prisma as any).executionLog;
  if (!logClient || typeof logClient.create !== "function") {
    return { id: undefined, status, message, startedAt, completedAt };
  }
  return logClient.create({
    data: {
      executionId,
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      status,
      message,
      startedAt,
      completedAt,
    },
  });
}

async function updateExecutionLog(
  logId: string | undefined,
  status: ExecutionStatus,
  message: string | undefined,
  completedAt: Date
) {
  const logClient = (prisma as any).executionLog;
  if (!logId || !logClient || typeof logClient.update !== "function") {
    return null;
  }
  return logClient.update({
    where: { id: logId },
    data: {
      status,
      message,
      completedAt,
    },
  });
}

function canPersistRunningStepLogs(): boolean {
  const logClient = (prisma as any).executionLog;
  return Boolean(logClient && typeof logClient.create === "function" && typeof logClient.update === "function");
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ApiError(504, `${label} timed out after ${Math.ceil(ms / 1000)}s`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  }) as Promise<T>;
}

async function assertNoRunningExecution(workflowId: string): Promise<void> {
  const executionClient = (prisma as any).workflowExecution;
  if (!executionClient || typeof executionClient.findFirst !== "function") {
    return;
  }

  const running = await executionClient.findFirst({
    where: {
      workflowId,
      status: ExecutionStatus.RUNNING,
    },
    select: { id: true, startedAt: true },
    orderBy: { startedAt: "desc" },
  });

  if (!running) return;

  const ageMs = Date.now() - new Date(running.startedAt).getTime();
  const staleAfterMs = 15 * 60 * 1000; // longer than max DELAY to avoid interrupting legitimate runs
  if (ageMs > staleAfterMs) {
    if (typeof executionClient.update === "function") {
      await executionClient.update({
        where: { id: running.id },
        data: {
          status: ExecutionStatus.FAILED,
          completedAt: new Date(),
        },
      });
    }
    const logClient = (prisma as any).executionLog;
    if (logClient && typeof logClient.create === "function") {
      await logClient.create({
        data: {
          executionId: running.id,
          stepId: "system",
          stepName: "Execution recovery",
          stepType: WorkflowStepType.TRIGGER,
          status: ExecutionStatus.FAILED,
          message: "Execution marked failed after exceeding the safe running window (possible interrupted process).",
          startedAt: new Date(),
          completedAt: new Date(),
        },
      }).catch(() => undefined);
    }
    return;
  }

  throw new ApiError(409, "Workflow already has a running execution. Wait for it to finish before starting another run.");
}

// =========================================================
// Workflow configuration validation (pre-execution)
// =========================================================

const WEBHOOK_PLACEHOLDER_HOSTS = ["api.example.com", "example.com", "www.example.com"];

function isTemplatedValue(value: string): boolean {
  return /\{\{[\s\S]*\}\}/.test(value);
}

function getOutgoingWebhookStepLabel(step: WorkflowStep): string {
  return step.name?.trim() || `Step ${step.stepOrder}`;
}

function assertValidOutgoingWebhookUrl(url: string, stepLabel: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ApiError(
      400,
      `${stepLabel} (WEBHOOK action): Webhook URL is invalid. Set a valid http(s) destination URL in the step editor.`
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ApiError(
      400,
      `${stepLabel} (WEBHOOK action): Webhook URL must start with http:// or https://. Set a valid destination URL in the step editor.`
    );
  }

  if (WEBHOOK_PLACEHOLDER_HOSTS.includes(parsed.hostname)) {
    throw new ApiError(
      400,
      `${stepLabel} (WEBHOOK action): Webhook URL contains a placeholder hostname ("${parsed.hostname}"). Configure a real webhook destination URL in the step editor.`
    );
  }
}

function validateWorkflowConfigurationForExecution(steps: WorkflowStep[]): void {
  for (const step of steps) {
    // Incoming TRIGGER steps do not require an outgoing webhook URL.
    if (step.type !== "WEBHOOK") {
      continue;
    }

    const stepLabel = getOutgoingWebhookStepLabel(step);
    const config = (step.config as Record<string, unknown>) ?? {};
    const rawUrl = typeof config.url === "string" ? config.url.trim() : "";

    if (!rawUrl) {
      throw new ApiError(
        400,
        `${stepLabel} (WEBHOOK action): Webhook URL is not configured. Please set a real URL in the step editor.`
      );
    }

    // URLs containing runtime templates cannot be fully validated before execution context is known.
    if (isTemplatedValue(rawUrl)) {
      continue;
    }

    assertValidOutgoingWebhookUrl(rawUrl, stepLabel);
  }
}

function resolveAndValidateOutgoingWebhookUrl(
  rawUrl: string,
  context: Record<string, any>,
  step: WorkflowStep
): string {
  const stepLabel = getOutgoingWebhookStepLabel(step);
  const trimmedRawUrl = rawUrl.trim();

  if (!trimmedRawUrl) {
    throw new ApiError(
      400,
      `${stepLabel} (WEBHOOK action): Webhook URL is not configured. Please set a real URL in the step editor.`
    );
  }

  const resolvedUrl = resolveTemplate(trimmedRawUrl, context).trim();
  if (!resolvedUrl) {
    throw new ApiError(
      400,
      `${stepLabel} (WEBHOOK action): Webhook URL resolved to an empty value. Provide a valid destination URL or template value in the step editor.`
    );
  }

  assertValidOutgoingWebhookUrl(resolvedUrl, stepLabel);
  return resolvedUrl;
}

// =========================================================
// Step executor with Execution Context resolution
// =========================================================

function getLatestAiOutput(context: Record<string, any>): string | undefined {
  const entries = Object.entries(context)
    .filter(([key, value]) => /^step_\d+$/.test(key) && value && typeof value === "object")
    .sort((a, b) => {
      const aNum = Number(a[0].split("_")[1] || 0);
      const bNum = Number(b[0].split("_")[1] || 0);
      return bNum - aNum;
    });

  for (const [, value] of entries) {
    const output = (value as Record<string, unknown>).output;
    if (typeof output === "string" && output.trim()) {
      return output;
    }
  }
  return undefined;
}

function buildExecutionContextSummary(context: Record<string, any>): string {
  try {
    const summary = Object.fromEntries(
      Object.entries(context).filter(([key]) => key === "trigger" || /^step_\d+$/.test(key))
    );
    const json = JSON.stringify(summary);
    if (!json) return "{}";
    return json.length > 6000 ? `${json.slice(0, 6000)}…` : json;
  } catch {
    return "{}";
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message || "Execution failed";
  return "Execution failed";
}

async function executeSingleStep(
  step: WorkflowStep,
  context: Record<string, any>,
  triggerInput?: Record<string, unknown>
) {
  switch (step.type) {
    case "TRIGGER": {
      const config = (step.config as Record<string, unknown>) ?? {};
      const input = triggerInput ?? {};

      const getValue = (key: string, altKey?: string) => {
        if (typeof input[key] === "string" && (input[key] as string).trim()) return (input[key] as string).trim();
        if (altKey && typeof input[altKey] === "string" && (input[altKey] as string).trim()) return (input[altKey] as string).trim();
        if (typeof config[key] === "string" && (config[key] as string).trim()) return (config[key] as string).trim();
        if (altKey && typeof config[altKey] === "string" && (config[altKey] as string).trim()) return (config[altKey] as string).trim();
        return "";
      };

      const triggerData = {
        ...config,
        ...input,
        employee_name: getValue("employee_name", "name"),
        employee_email: getValue("employee_email", "email"),
        department: getValue("department"),
        job_title: getValue("job_title"),
        company_name: getValue("company_name") || "FlowPilot",
        manager_name: getValue("manager_name", "manager"),
        manager_email: getValue("manager_email"),
        start_date: getValue("start_date"),
        company_address: getValue("company_address"),
        company_phone: getValue("company_phone"),
      };

      return {
        success: true,
        message: "Trigger executed",
        output: triggerData,
      };
    }

    case "AI": {
      const trigger = context.trigger || {};
      const config = (step.config as Record<string, unknown>) ?? {};

      const rawInstructions =
        typeof config.prompt === "string" && config.prompt.trim()
          ? config.prompt
          : "Generate a professional welcome email.";
      const instructions = resolveTemplate(rawInstructions, context);
      const contextSummary = buildExecutionContextSummary(context);

      const prompt = `
You are an AI assistant running inside a FlowPilot workflow step.

Use the available workflow context and prior step outputs when relevant. If specific fields are missing, produce the best useful result without inventing facts.

Trigger context:
- Employee Name: ${trigger.employee_name ?? ""}
- Employee Email: ${trigger.employee_email ?? ""}
- Department: ${trigger.department ?? ""}
- Job Title: ${trigger.job_title ?? ""}
- Company: ${trigger.company_name ?? ""}
- Manager: ${trigger.manager_name ?? ""}
- Start Date: ${trigger.start_date ?? ""}

Workflow context (JSON):
${contextSummary}

Instructions:
${instructions}
`;

      const response = await withTimeout(generateAIResponse(prompt), 60_000, "AI action");

      return {
        success: true,
        message: "AI content generated successfully.",
        output: response,
      };
    }

    case "EMAIL": {
      const trigger = context.trigger || {};
      const config = (step.config as Record<string, unknown>) ?? {};

      const configuredTo = typeof config.to === "string" ? resolveTemplate(config.to, context).trim() : "";
      const configuredSubject = typeof config.subject === "string" ? resolveTemplate(config.subject, context).trim() : "";
      const configuredBody = typeof config.body === "string" ? resolveTemplate(config.body, context).trim() : "";

      const fallbackTo = typeof trigger.employee_email === "string" ? trigger.employee_email.trim() : "";
      const to = configuredTo || fallbackTo;
      if (!to) {
        throw new ApiError(400, "EMAIL action: recipient is missing. Configure a recipient or provide trigger employee_email.");
      }

      const latestAiOutput = getLatestAiOutput(context) ?? (typeof context.step_2?.output === "string" ? context.step_2.output : undefined) ?? (typeof context.step_1?.output === "string" ? context.step_1.output : undefined);
      const companyName = (trigger.company_name as string) || "FlowPilot";
      const employeeName = (trigger.employee_name as string) || "Team Member";

      const subject = configuredSubject || `Welcome to ${companyName}, ${employeeName}!`;
      const htmlContent = configuredBody || renderWelcomeEmailHtml(trigger, latestAiOutput);

      try {
        await withTimeout(sendEmail(to, subject, htmlContent), 30_000, "EMAIL action");
      } catch (error) {
        if (error instanceof ApiError) throw error;
        const message = error instanceof Error && error.message ? error.message : "Email delivery failed";
        throw new ApiError(502, `EMAIL action failed: ${message}`);
      }

      return {
        success: true,
        message: `Email sent to ${to}`,
        output: {
          to,
          subject,
          body: htmlContent,
        },
      };
    }

    case "WEBHOOK": {
      const config = (step.config as Record<string, unknown>) ?? {};

      const rawUrl = typeof config.url === "string" ? config.url : "";
      const url = resolveAndValidateOutgoingWebhookUrl(rawUrl, context, step);

      const rawMethod = typeof config.method === "string" ? config.method.toUpperCase() : "POST";
      const method = (["GET", "POST", "PUT", "PATCH", "DELETE"].includes(rawMethod) ? rawMethod : "POST") as
        | "GET"
        | "POST"
        | "PUT"
        | "PATCH"
        | "DELETE";

      const rawHeaders =
        typeof config.headers === "object" && config.headers !== null && !Array.isArray(config.headers)
          ? (config.headers as Record<string, unknown>)
          : {};

      const resolvedHeaders = resolveObjectTemplates(rawHeaders, context) as Record<string, unknown>;
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(resolvedHeaders)) {
        if (value === undefined || value === null) continue;
        headers[key] = typeof value === "string" ? value : JSON.stringify(value);
      }

      let body = config.body;
      if (typeof body === "string") {
        body = resolveTemplate(body, context);
      } else if (typeof body === "object" && body !== null) {
        body = resolveObjectTemplates(body, context);
      }

      const response = await withTimeout(
        executeWebhook({
          url,
          method,
          headers,
          body,
        }),
        30_000,
        "WEBHOOK action"
      );

      return {
        success: true,
        message:
          typeof response === "string"
            ? response
            : response === undefined
            ? `Webhook request succeeded (${method} ${url})`
            : JSON.stringify(response),
        output: response,
      };
    }

    case "DELAY": {
      const config = (step.config as Record<string, unknown>) ?? {};

      let milliseconds: number | null = null;
      if (typeof config.milliseconds === "number" && Number.isFinite(config.milliseconds)) {
        milliseconds = config.milliseconds;
      } else if (typeof config.seconds === "number" && Number.isFinite(config.seconds)) {
        milliseconds = config.seconds * 1000;
      } else if (typeof config.milliseconds === "string" && config.milliseconds.trim() !== "" && !Number.isNaN(Number(config.milliseconds))) {
        milliseconds = Number(config.milliseconds);
      } else if (typeof config.seconds === "string" && config.seconds.trim() !== "" && !Number.isNaN(Number(config.seconds))) {
        milliseconds = Number(config.seconds) * 1000;
      }

      const safeMilliseconds = Math.max(0, Math.min(Math.floor(milliseconds ?? 5000), 10 * 60 * 1000));
      await new Promise((resolve) => setTimeout(resolve, safeMilliseconds));

      return {
        success: true,
        message: `Delayed for ${safeMilliseconds} ms`,
        output: { milliseconds: safeMilliseconds },
      };
    }

    default:
      throw new ApiError(400, `Unsupported workflow step type: ${String((step as { type?: unknown }).type ?? "unknown")}`);
  }
}

// =========================================================
// Execute loaded workflow (shared core)
// =========================================================

async function executeLoadedWorkflow(
  workflow: { id: string; steps: WorkflowStep[] },
  triggerInput?: Record<string, unknown>
) {
  if (workflow.steps.length === 0) {
    throw new ApiError(400, "Workflow has no steps.");
  }

  // Prevent execution of invalid workflow configurations before creating an execution record.
  validateWorkflowConfigurationForExecution(workflow.steps);

  // Create execution record
  const execution = await createExecution(workflow.id);

  // Execution context
  const context: Record<string, any> = {
    trigger: {},
    step_1: {},
    step_2: {},
    step_3: {},
  };

  try {
    // Execute every step
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepKey = `step_${i + 1}`;
      const startedAt = new Date();

    const persistRunningLog = canPersistRunningStepLogs();
    const runningLog = persistRunningLog
      ? await createExecutionLog(
          execution.id,
          step,
          ExecutionStatus.RUNNING,
          "Step execution started",
          startedAt,
          null
        )
      : null;

      try {
        const result = await executeSingleStep(step, context, triggerInput);

        // Store step output in execution context (preserve backward-compatible access patterns)
        if (step.type === "TRIGGER") {
          context[stepKey] = result.output;
          context.trigger = result.output;
        } else if (result.output && typeof result.output === "object" && !Array.isArray(result.output)) {
          context[stepKey] = { ...(result.output as Record<string, unknown>), output: result.output };
        } else {
          context[stepKey] = { output: result.output };
        }

        const completedAt = new Date();
        const completedMessage =
          typeof result.message === "string" && result.message.trim()
            ? result.message
            : step.type === "AI" && typeof result.output === "string"
            ? result.output
            : "Step completed";

      if (persistRunningLog && runningLog?.id) {
        const updated = await updateExecutionLog(
          runningLog.id,
          ExecutionStatus.COMPLETED,
          completedMessage,
          completedAt
        );
        if (!updated) {
          await createExecutionLog(
            execution.id,
            step,
            ExecutionStatus.COMPLETED,
            completedMessage,
            startedAt,
            completedAt
          );
        }
      } else {
        await createExecutionLog(
          execution.id,
          step,
          ExecutionStatus.COMPLETED,
          completedMessage,
          startedAt,
          completedAt
        );
      }
      } catch (err) {
        const completedAt = new Date();
      const failureMessage = toErrorMessage(err);

      if (persistRunningLog && runningLog?.id) {
        const updated = await updateExecutionLog(
          runningLog.id,
          ExecutionStatus.FAILED,
          failureMessage,
          completedAt
        ).catch(() => null);
        if (!updated) {
          await createExecutionLog(
            execution.id,
            step,
            ExecutionStatus.FAILED,
            failureMessage,
            startedAt,
            completedAt
          );
        }
      } else {
        await createExecutionLog(
          execution.id,
          step,
          ExecutionStatus.FAILED,
          failureMessage,
          startedAt,
          completedAt
        );
      }

        throw err;
      }
    }

    // Mark execution completed
    const completedExecution =
      await prisma.workflowExecution.update({
        where: {
          id: execution.id,
        },
        data: {
          status: ExecutionStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          logs: {
            orderBy: {
              startedAt: "asc",
            },
          },
        },
      });

    return completedExecution;
  } catch (error) {
    // Mark execution failed
    await prisma.workflowExecution.update({
      where: {
        id: execution.id,
      },
      data: {
        status: ExecutionStatus.FAILED,
        completedAt: new Date(),
      },
    }).catch(() => undefined);

    throw error;
  }
}

// =========================================================
// Execute workflow (manual, authenticated owner)
// =========================================================

export async function executeWorkflow(
  workflowId: string,
  userId: string,
  triggerInput?: Record<string, unknown>
) {
  const workflow = await getWorkflowForExecution(workflowId, userId);
  await assertNoRunningExecution(workflow.id);
  return executeLoadedWorkflow(workflow, triggerInput);
}

// =========================================================
// Execute workflow via incoming webhook trigger
// =========================================================

export async function executeWorkflowFromWebhook(
  workflowId: string,
  providedSecret: string | null,
  triggerInput?: Record<string, unknown>
) {
  const workflow = await getWorkflowForIncomingWebhook(workflowId, providedSecret);
  await assertNoRunningExecution(workflow.id);
  const payload = {
    ...(triggerInput ?? {}),
    _triggerSource: "webhook",
  };
  return executeLoadedWorkflow(workflow, payload);
}

// =========================================================
// Get execution by id
// =========================================================

export async function getExecution(
  executionId: string,
  userId: string
) {
  const execution =
    await prisma.workflowExecution.findFirst({
      where: {
        id: executionId,
        workflow: {
          userId,
        },
      },
      include: {
        workflow: true,
        logs: {
          orderBy: {
            startedAt: "asc",
          },
        },
      },
    });

  if (!execution) {
    throw new ApiError(404, "Execution not found");
  }

  return execution;
}

// =========================================================
// List executions
// =========================================================

export async function getExecutions(
  userId: string
) {
  return prisma.workflowExecution.findMany({
    where: {
      workflow: {
        userId,
      },
    },
    include: {
      workflow: true,
    },
    orderBy: {
      startedAt: "desc",
    },
  });
}

// =========================================================
// Dashboard summary (authenticated user, real aggregated data)
// =========================================================

export async function getExecutionDashboardSummary(userId: string) {
  const now = new Date();
  const trendDays = 7;
  const trendStart = new Date(now);
  trendStart.setUTCHours(0, 0, 0, 0);
  trendStart.setUTCDate(trendStart.getUTCDate() - (trendDays - 1));

  const [
    workflowTotal,
    workflowActive,
    workflowDraft,
    workflowArchived,
    executionTotal,
    executionCompleted,
    executionFailed,
    executionRunning,
    recentExecutions,
    trendExecutions,
  ] = await Promise.all([
    prisma.workflow.count({ where: { userId } }),
    prisma.workflow.count({ where: { userId, status: "ACTIVE" } }),
    prisma.workflow.count({ where: { userId, status: "DRAFT" } }),
    prisma.workflow.count({ where: { userId, status: "ARCHIVED" } }),
    prisma.workflowExecution.count({ where: { workflow: { userId } } }),
    prisma.workflowExecution.count({ where: { workflow: { userId }, status: ExecutionStatus.COMPLETED } }),
    prisma.workflowExecution.count({ where: { workflow: { userId }, status: ExecutionStatus.FAILED } }),
    prisma.workflowExecution.count({ where: { workflow: { userId }, status: ExecutionStatus.RUNNING } }),
    prisma.workflowExecution.findMany({
      where: { workflow: { userId } },
      include: {
        workflow: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
    prisma.workflowExecution.findMany({
      where: {
        workflow: { userId },
        startedAt: { gte: trendStart },
      },
      select: {
        startedAt: true,
        status: true,
      },
    }),
  ]);

  const successRate = executionTotal > 0
    ? Math.round((executionCompleted / executionTotal) * 100)
    : 0;

  const trendMap = new Map<string, { date: string; total: number; completed: number; failed: number; running: number }>();
  for (let i = 0; i < trendDays; i++) {
    const d = new Date(trendStart);
    d.setUTCDate(trendStart.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    trendMap.set(key, { date: key, total: 0, completed: 0, failed: 0, running: 0 });
  }

  for (const exec of trendExecutions) {
    const key = exec.startedAt.toISOString().slice(0, 10);
    const bucket = trendMap.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (exec.status === ExecutionStatus.COMPLETED) bucket.completed += 1;
    else if (exec.status === ExecutionStatus.FAILED) bucket.failed += 1;
    else if (exec.status === ExecutionStatus.RUNNING) bucket.running += 1;
  }

  return {
    workflows: {
      total: workflowTotal,
      active: workflowActive,
      draft: workflowDraft,
      archived: workflowArchived,
    },
    executions: {
      total: executionTotal,
      completed: executionCompleted,
      failed: executionFailed,
      running: executionRunning,
      successRate,
    },
    recentExecutions,
    trend: Array.from(trendMap.values()),
    generatedAt: now.toISOString(),
  };
}