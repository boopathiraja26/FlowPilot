import {
  ExecutionStatus,
  Prisma,
  WorkflowExecution,
  WorkflowStep,
  WorkflowStepType,
} from "@prisma/client";

import prisma from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import { generateAIResponse } from "./gemini.service";
import { sendEmail } from "./email.service";
import { executeWebhook } from "./webhook.service";
import {
  resolveTemplate,
  resolveObjectTemplates,
  renderWelcomeEmailHtml,
} from "../utils/template";
import {
  buildWorkflowAiPrompt,
  escapeHtmlText,
  isOnboardingTrigger,
  resolveEmailStepConfig,
} from "../utils/executionConfig";
import {
  executeWorkflowSteps,
  isValidEmailAddress,
  isValidWebhookUrl,
  validateWorkflowSteps,
  WorkflowStepExecutionError,
} from "../utils/workflowExecution";
import type { WorkflowExecutionContext } from "../utils/workflowExecution";
import {
  buildExecutionWhere,
  getExecutionOffset,
} from "../utils/executionQuery";
import type { ExecutionListQuery } from "../utils/executionQuery";
import {
  EXECUTION_JOB_NAME,
  getExecutionJobOptions,
  getExecutionQueue,
} from "../queue/executionQueue";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    throw new Error("Webhook headers must be a JSON object of string values.");
  }

  const headers: Record<string, string> = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if (typeof entryValue !== "string") {
      throw new Error("Webhook header values must be strings.");
    }
    headers[key] = entryValue;
  }

  return headers;
}

// =========================================================
// Get workflow with ownership + steps
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
        orderBy: [{ stepOrder: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!workflow) {
    throw new ApiError(404, "Workflow not found");
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
      startedAt: new Date(),
    },
  });
}

function withoutTriggerInput<T extends { triggerInput?: unknown }>(
  execution: T
): Omit<T, "triggerInput"> {
  const { triggerInput: _triggerInput, ...publicExecution } = execution;
  return publicExecution;
}

export async function markExecutionFailed(
  executionId: string,
  failureReason: string
): Promise<void> {
  await prisma.workflowExecution.updateMany({
    where: {
      id: executionId,
      status: { in: [ExecutionStatus.QUEUED, ExecutionStatus.RUNNING] },
    },
    data: {
      status: ExecutionStatus.FAILED,
      failureReason,
      completedAt: new Date(),
      triggerInput: Prisma.DbNull,
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
  message: string,
  startedAt: Date,
  completedAt: Date
) {
  return prisma.executionLog.create({
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

// =========================================================
// Step executor with Execution Context resolution
// =========================================================

async function executeSingleStep(
  step: WorkflowStep,
  context: WorkflowExecutionContext,
  userId: string
) {
  switch (step.type) {
    case "TRIGGER": {
      const config = (step.config as Record<string, unknown>) ?? {};
      const input = context.trigger;

      const getValue = (key: string, altKey?: string) => {
        if (typeof input[key] === "string" && input[key].trim()) return input[key].trim();
        if (altKey && typeof input[altKey] === "string" && input[altKey].trim()) return input[altKey].trim();
        if (typeof config[key] === "string" && config[key].trim()) return config[key].trim();
        if (altKey && typeof config[altKey] === "string" && config[altKey].trim()) return config[altKey].trim();
        return "";
      };

      const triggerData = {
        ...config,
        ...input,
        employee_name: getValue("employee_name", "name"),
        employee_email: getValue("employee_email", "email"),
        department: getValue("department"),
        job_title: getValue("job_title"),
        company_name: getValue("company_name"),
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
      const config = (step.config as Record<string, unknown>) ?? {};
      const prompt = buildWorkflowAiPrompt(config.prompt, context);
      const response = await generateAIResponse(prompt, userId);

      return {
        success: true,
        message: "AI content generated successfully.",
        output: response,
      };
    }

    case "EMAIL": {
      const trigger =
        typeof context.trigger === "object" && context.trigger !== null
          ? (context.trigger as Record<string, unknown>)
          : {};
      const config = (step.config as Record<string, unknown>) ?? {};
      const emailConfig = resolveEmailStepConfig(config, context);
      const configuredRecipient =
        typeof config.to === "string" && config.to.trim().length > 0;
      const recipient =
        emailConfig.to ||
        (!configuredRecipient
          ? (typeof trigger.employee_email === "string" && trigger.employee_email) ||
            (typeof trigger.email === "string" && trigger.email) ||
            ""
          : "");

      if (!recipient) {
        throw new Error(
          "Email recipient is required. Set it in the Email step or provide an email in the trigger payload."
        );
      }
      if (!isValidEmailAddress(recipient)) {
        throw new Error("Email recipient must be a valid email address.");
      }

      const employeeName =
        (typeof trigger.employee_name === "string" && trigger.employee_name) ||
        (typeof trigger.name === "string" && trigger.name) ||
        "";
      const isOnboarding = isOnboardingTrigger(trigger);
      const companyName =
        typeof trigger.company_name === "string" && trigger.company_name
          ? trigger.company_name
          : "FlowPilot";
      const subject =
        emailConfig.subject ||
        (isOnboarding && employeeName
          ? `Welcome to ${companyName}, ${employeeName}!`
          : "FlowPilot workflow notification");
      const aiOutput =
        typeof context.latestAiOutput === "string"
          ? context.latestAiOutput
          : undefined;
      const body =
        emailConfig.body ||
        (isOnboarding
          ? renderWelcomeEmailHtml(trigger, aiOutput)
          : aiOutput
            ? `<pre style="white-space:pre-wrap">${escapeHtmlText(aiOutput)}</pre>`
            : "");

      if (!body) {
        throw new Error(
          "Email body is required unless an AI step provides content."
        );
      }

      await sendEmail(recipient, subject, body, userId);

      return {
        success: true,
        message: "Email sent successfully.",
        output: {
          to: recipient,
          subject,
          body,
        },
      };
    }
    case "WEBHOOK": {
      const config = (step.config as Record<string, unknown>) ?? {};

      const rawUrl = typeof config.url === "string" ? config.url : "";

      if (!rawUrl) {
        throw new Error("Webhook URL is not configured. Please set a real URL in the step editor.");
      }

      const url = resolveTemplate(rawUrl, context);

      if (!isValidWebhookUrl(url)) {
        throw new Error(
          "Webhook URL must be a valid HTTP(S) URL without embedded credentials or placeholder hosts."
        );
      }

      const methodValue =
        typeof config.method === "string"
          ? config.method.toUpperCase()
          : "POST";
      const method =
        methodValue === "GET" ||
        methodValue === "POST" ||
        methodValue === "PUT" ||
        methodValue === "PATCH" ||
        methodValue === "DELETE"
          ? methodValue
          : "POST";

      const rawHeaders =
        config.headers === undefined ? {} : toStringRecord(config.headers);

      const headers = toStringRecord(resolveObjectTemplates(rawHeaders, context));

      let body = config.body;
      if (typeof body === "string") {
        body = resolveTemplate(body, context);
      } else if (typeof body === "object" && body !== null) {
        body = resolveObjectTemplates(body, context);
      }

      const response = await executeWebhook({
        url,
        method,
        headers,
        body,
      });

      return {
        success: true,
        message:
          typeof response === "string" ? response : JSON.stringify(response),
        output: response,
      };
    }

    case "DELAY": {
      const config = (step.config as Record<string, unknown>) ?? {};

      const milliseconds =
        typeof config.milliseconds === "number"
          ? config.milliseconds
          : 5000;

      await new Promise((resolve) =>
        setTimeout(resolve, milliseconds)
      );

      return {
        success: true,
        message: `Delayed for ${milliseconds} ms`,
        output: { milliseconds },
      };
    }

    default:
      throw new Error("Unknown workflow step.");
  }
}

// =========================================================
// Execute and persist one workflow execution
// =========================================================

async function runExecution(
  executionId: string,
  workflow: Awaited<ReturnType<typeof getWorkflowForExecution>>,
  triggerInput: Record<string, unknown>
) {
  try {
    await executeWorkflowSteps(
      workflow.steps,
      triggerInput,
      (step, context) => executeSingleStep(step, context, workflow.userId),
      (step, status, message, startedAt, completedAt) =>
        createExecutionLog(
          executionId,
          step,
          status,
          message,
          startedAt,
          completedAt
        )
    );

    // Mark execution completed
    const completedExecution =
      await prisma.workflowExecution.update({
        where: {
          id: executionId,
        },
        data: {
          status: ExecutionStatus.COMPLETED,
          completedAt: new Date(),
          failureReason: null,
          triggerInput: Prisma.DbNull,
        },
        include: {
          logs: {
            orderBy: {
              startedAt: "asc",
            },
          },
        },
      });

    return withoutTriggerInput(completedExecution);
  } catch (error) {
    try {
      await markExecutionFailed(
        executionId,
        error instanceof WorkflowStepExecutionError
          ? error.message
          : "Workflow execution failed. Inspect its step logs and configuration before starting another run."
      );
    } catch {
      console.error(
        `[execution] Failed to mark execution ${executionId} as FAILED.`
      );
    }

    if (error instanceof WorkflowStepExecutionError) {
      throw new ApiError(502, error.message);
    }

    throw error;
  }
}

function validateExecutionRequest(
  workflow: Awaited<ReturnType<typeof getWorkflowForExecution>>,
  triggerInput: unknown
): Record<string, unknown> {
  if (workflow.steps.length === 0) {
    throw new ApiError(400, "Workflow has no steps.");
  }

  const issues = validateWorkflowSteps(workflow.steps);
  if (issues.length > 0) {
    throw new ApiError(400, "Workflow configuration is invalid.", issues);
  }

  if (triggerInput !== undefined && !isRecord(triggerInput)) {
    throw new ApiError(400, "Trigger input must be a JSON object.");
  }

  return isRecord(triggerInput) ? triggerInput : {};
}

export async function executeWorkflow(
  workflowId: string,
  userId: string,
  triggerInput?: unknown
) {
  const workflow = await getWorkflowForExecution(workflowId, userId);
  const normalizedTriggerInput = validateExecutionRequest(workflow, triggerInput);
  const execution = await createExecution(workflow.id);

  return runExecution(execution.id, workflow, normalizedTriggerInput);
}

export async function enqueueWorkflow(
  workflowId: string,
  userId: string,
  triggerInput?: unknown
) {
  const workflow = await getWorkflowForExecution(workflowId, userId);
  const normalizedTriggerInput = validateExecutionRequest(workflow, triggerInput);
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      status: ExecutionStatus.QUEUED,
      startedAt: null,
      triggerInput: normalizedTriggerInput as Prisma.InputJsonValue,
    },
  });

  try {
    await getExecutionQueue().add(
      EXECUTION_JOB_NAME,
      { executionId: execution.id },
      getExecutionJobOptions(execution.id)
    );
  } catch {
    await markExecutionFailed(
      execution.id,
      "Execution could not be queued because the background worker service is unavailable."
    );
    throw new ApiError(503, "Background execution is temporarily unavailable.");
  }

  return getExecution(execution.id, userId);
}

export async function processQueuedExecution(executionId: string): Promise<void> {
  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        include: {
          steps: {
            orderBy: [{ stepOrder: "asc" }, { id: "asc" }],
          },
        },
      },
    },
  });

  if (!execution || execution.status !== ExecutionStatus.QUEUED) {
    return;
  }

  if (!isRecord(execution.triggerInput)) {
    await markExecutionFailed(
      executionId,
      "Queued trigger data is unavailable. Start a new execution after checking workflow state."
    );
    return;
  }

  const issues = validateWorkflowSteps(execution.workflow.steps);
  if (execution.workflow.steps.length === 0 || issues.length > 0) {
    await markExecutionFailed(
      executionId,
      "Workflow configuration is invalid. No automatic retry was attempted."
    );
    return;
  }

  const started = await prisma.workflowExecution.updateMany({
    where: {
      id: executionId,
      status: ExecutionStatus.QUEUED,
    },
    data: {
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
      failureReason: null,
    },
  });

  if (started.count === 0) {
    return;
  }

  await runExecution(
    executionId,
    execution.workflow,
    execution.triggerInput
  );
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

  return withoutTriggerInput(execution);
}

// =========================================================
// List executions
// =========================================================

export async function getExecutions(
  userId: string,
  query?: ExecutionListQuery
) {
  const where = buildExecutionWhere(userId, query ?? {});

  if (!query) {
    const executions = await prisma.workflowExecution.findMany({
      where,
      include: { workflow: true },
      orderBy: [
        { startedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });
    return executions.map(withoutTriggerInput);
  }

  const [executions, total] = await prisma.$transaction([
    prisma.workflowExecution.findMany({
      where,
      include: { workflow: true },
      orderBy: [
        { startedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "desc" },
      ],
      skip: getExecutionOffset(query),
      take: query.limit,
    }),
    prisma.workflowExecution.count({ where }),
  ]);

  return {
    executions: executions.map(withoutTriggerInput),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}