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
import { resolveTemplate, resolveObjectTemplates } from "../utils/template";

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
        if (typeof input[key] === "string") return input[key] as string;
        if (typeof config[key] === "string") return config[key] as string;
        if (altKey && typeof input[altKey] === "string") return input[altKey] as string;
        if (altKey && typeof config[altKey] === "string") return config[altKey] as string;
        return "";
      };

      const triggerData = {
        employee_name: getValue("employee_name", "name"),
        employee_email: getValue("employee_email", "email"),
        department: getValue("department"),
        job_title: getValue("job_title"),
        company_name: getValue("company_name"),
        manager_name: getValue("manager_name"),
        manager_email: getValue("manager_email"),
        start_date: getValue("start_date"),
        company_address: getValue("company_address"),
        company_phone: getValue("company_phone"),
        ...config,
        ...input,
      };

      return {
        success: true,
        message: "Trigger executed",
        output: triggerData,
      };
    }

    case "AI": {
      const config = (step.config as Record<string, unknown>) ?? {};

      const rawPrompt =
        typeof config.prompt === "string"
          ? config.prompt
          : "Hello from FlowPilot";

      const prompt = resolveTemplate(rawPrompt, context);

      const response = await generateAIResponse(prompt);

      return {
        success: true,
        message: response,
        output: response,
      };
    }

    case "EMAIL": {
      const config = (step.config as Record<string, unknown>) ?? {};

      const rawTo = typeof config.to === "string" ? config.to : "";
      const rawSubject =
        typeof config.subject === "string"
          ? config.subject
          : "FlowPilot Notification";
      const rawBody =
        typeof config.body === "string"
          ? config.body
          : "<h2>Hello from FlowPilot</h2>";

      const to = resolveTemplate(rawTo, context);
      const subject = resolveTemplate(rawSubject, context);
      const body = resolveTemplate(rawBody, context);

      if (!to) {
        throw new Error("Email recipient is missing.");
      }

      await sendEmail(to, subject, body);

      return {
        success: true,
        message: `Email sent to ${to}`,
        output: {
          to,
          subject,
          body,
        },
      };
    }

    case "WEBHOOK": {
      const config = (step.config as Record<string, unknown>) ?? {};

      const rawUrl = typeof config.url === "string" ? config.url : "";

      if (!rawUrl) {
        throw new Error("Webhook URL is required.");
      }

      const url = resolveTemplate(rawUrl, context);

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
// Execute workflow
// =========================================================

export async function executeWorkflow(
  workflowId: string,
  userId: string,
  triggerInput?: Record<string, unknown>
) {
  // Load workflow
  const workflow = await getWorkflowForExecution(
    workflowId,
    userId
  );

  if (workflow.steps.length === 0) {
    throw new ApiError(400, "Workflow has no steps.");
  }

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
          result.message
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