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
  message?: string
) {
  return prisma.executionLog.create({
    data: {
      executionId,
      stepId: step.id,
      stepName: step.name,
      stepType: step.type,
      status,
      message,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
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

      const instructions =
        typeof config.prompt === "string"
          ? config.prompt
          : "Generate a professional welcome email.";

      const prompt = `
You are an HR assistant.

Employee Name: ${trigger.employee_name}
Employee Email: ${trigger.employee_email}
Department: ${trigger.department}
Job Title: ${trigger.job_title}
Company: ${trigger.company_name}
Manager: ${trigger.manager_name}
Start Date: ${trigger.start_date}

Instructions:
${instructions}
`;

      const response = await generateAIResponse(prompt);

      return {
        success: true,
        message: "AI content generated successfully.",
        output: response,
      };
    }

    case "EMAIL": {
      const trigger = context.trigger || {};
      const aiOutput = context.step_2?.output || context.step_1?.output;

      if (!trigger.employee_email) {
        throw new Error("Employee email is missing.");
      }

      const companyName = trigger.company_name || "FlowPilot";
      const employeeName = trigger.employee_name || "Team Member";
      const subject = `Welcome to ${companyName}, ${employeeName}! 🚀`;

      const htmlContent = renderWelcomeEmailHtml(
        trigger,
        typeof aiOutput === "string" ? aiOutput : undefined
      );

      await sendEmail(
        trigger.employee_email,
        subject,
        htmlContent
      );

      return {
        success: true,
        message: `Welcome email sent to ${trigger.employee_email}`,
        output: {
          to: trigger.employee_email,
          subject,
          body: htmlContent,
        },
      };
    }
    case "WEBHOOK": {
      const config = (step.config as Record<string, unknown>) ?? {};

      const rawUrl = typeof config.url === "string" ? config.url : "";
      const url = resolveAndValidateOutgoingWebhookUrl(rawUrl, context, step);

      const method =
        typeof config.method === "string"
          ? (config.method as
              | "GET"
              | "POST"
              | "PUT"
              | "PATCH"
              | "DELETE")
          : "POST";

      const rawHeaders =
        typeof config.headers === "object" && config.headers !== null
          ? (config.headers as Record<string, string>)
          : {};

      const headers = resolveObjectTemplates(rawHeaders, context);

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

      try {
        const result = await executeSingleStep(step, context, triggerInput);

        // Store step output in execution context
        if (step.type === "AI") {
          context[stepKey] = { output: result.output };
        } else if (step.type === "TRIGGER") {
          context[stepKey] = result.output;
          context.trigger = result.output;
        } else if (
          typeof result.output === "object" &&
          result.output !== null
        ) {
          context[stepKey] = result.output;
        } else {
          context[stepKey] = { output: result.output };
        }

        await createExecutionLog(
          execution.id,
          step,
          ExecutionStatus.COMPLETED,
          step.type === "AI" && typeof result.output === "string"
            ? result.output
            : result.message
        );
      } catch (err) {
        await createExecutionLog(
          execution.id,
          step,
          ExecutionStatus.FAILED,
          err instanceof Error
            ? err.message
            : "Execution failed"
        );

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
    });

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