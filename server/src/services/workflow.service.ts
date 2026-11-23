import { Workflow, WorkflowStep } from "@prisma/client";

import { ApiError } from "../middleware/errorHandler";
import { CreateWorkflowInput, UpdateWorkflowInput } from "../validators/workflow.validation";
import prisma from "../lib/prisma";
import { assertWorkflowCanActivate, generateWebhookSecret, normalizeTriggerConfig } from "../utils/workflow-trigger";

// =========================================================
// Types
// =========================================================

export type WorkflowWithSteps = Workflow & { steps: WorkflowStep[] };

export type WorkflowExecutionActivity = {
  executionCount: number;
  lastExecution: {
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
  } | null;
};

export type WorkflowWithStepsAndActivity = WorkflowWithSteps & {
  executionCount: number;
  lastExecution: {
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
  } | null;
};

function mapWorkflowWithActivity(workflow: any): WorkflowWithStepsAndActivity {
  const { executions, _count, ...rest } = workflow;
  const lastExecution = Array.isArray(executions) && executions.length > 0 ? executions[0] : null;
  return {
    ...rest,
    executionCount: _count?.executions ?? 0,
    lastExecution: lastExecution
      ? {
          id: lastExecution.id,
          status: lastExecution.status,
          startedAt: lastExecution.startedAt,
          completedAt: lastExecution.completedAt ?? null,
        }
      : null,
  };
}

function cloneStepConfigForDuplicate(type: string, config: unknown): Record<string, unknown> | null {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return config == null ? null : ({} as Record<string, unknown>);
  }

  const cloned = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
  if (type === "TRIGGER") {
    const normalized = normalizeTriggerConfig(cloned);
    if (normalized.triggerMode === "webhook") {
      cloned.webhookSecret = generateWebhookSecret();
      delete (cloned as any).webhook_secret;
      cloned.triggerMode = "webhook";
    }
  }
  return cloned;
}

// =========================================================
// Helpers
// =========================================================

async function findOwnedWorkflowOrThrow(
  workflowId: string,
  userId: string
): Promise<WorkflowWithSteps> {
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

  if (workflow.userId !== userId) {
    throw new ApiError(403, "You do not have access to this workflow");
  }

  return workflow;
}

// =========================================================
// createWorkflow
// =========================================================

export async function createWorkflow(
  userId: string,
  input: CreateWorkflowInput
): Promise<WorkflowWithSteps> {
  const workflow = await prisma.workflow.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "DRAFT",
      userId,
    },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  return workflow;
}

// =========================================================
// getWorkflows
// =========================================================

export async function getWorkflows(userId: string): Promise<WorkflowWithStepsAndActivity[]> {
  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
      executions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
        },
      },
      _count: {
        select: { executions: true },
      },
    },
  });

  return workflows.map(mapWorkflowWithActivity);
}

// =========================================================
// getWorkflowById
// =========================================================

export async function getWorkflowById(
  userId: string,
  workflowId: string
): Promise<WorkflowWithSteps> {
  return findOwnedWorkflowOrThrow(workflowId, userId);
}

// =========================================================
// updateWorkflow
// =========================================================

export async function updateWorkflow(
  userId: string,
  workflowId: string,
  input: UpdateWorkflowInput
): Promise<WorkflowWithSteps> {
  const existing = await findOwnedWorkflowOrThrow(workflowId, userId);

  if (input.status === "ACTIVE") {
    assertWorkflowCanActivate(existing);
  }

  const updatedWorkflow = await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  return updatedWorkflow;
}

// =========================================================
// activateWorkflow
// =========================================================

export async function activateWorkflow(
  userId: string,
  workflowId: string
): Promise<WorkflowWithSteps> {
  const workflow = await findOwnedWorkflowOrThrow(workflowId, userId);
  assertWorkflowCanActivate(workflow);

  return prisma.workflow.update({
    where: { id: workflowId },
    data: { status: "ACTIVE" },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });
}

// =========================================================
// deactivateWorkflow
// =========================================================

export async function deactivateWorkflow(
  userId: string,
  workflowId: string
): Promise<WorkflowWithSteps> {
  await findOwnedWorkflowOrThrow(workflowId, userId);

  return prisma.workflow.update({
    where: { id: workflowId },
    data: { status: "DRAFT" },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });
}

// =========================================================
// duplicateWorkflow
// =========================================================

export async function duplicateWorkflow(
  userId: string,
  workflowId: string
): Promise<WorkflowWithSteps> {
  const existing = await findOwnedWorkflowOrThrow(workflowId, userId);

  const baseTitle = existing.title?.trim() || "Workflow";
  const copyTitle = baseTitle.toLowerCase().startsWith("copy of ")
    ? baseTitle
    : `Copy of ${baseTitle}`;

  const created = await prisma.workflow.create({
    data: {
      title: copyTitle.slice(0, 255),
      description: existing.description,
      status: "DRAFT",
      userId,
      steps: {
        create: existing.steps
          .slice()
          .sort((a, b) => a.stepOrder - b.stepOrder)
          .map((step) => ({
            stepOrder: step.stepOrder,
            type: step.type,
            name: step.name,
            config: cloneStepConfigForDuplicate(step.type, step.config) as any,
          })),
      },
    },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  return created;
}

// =========================================================
// deleteWorkflow
// =========================================================

export async function deleteWorkflow(
  userId: string,
  workflowId: string
): Promise<void> {
  await findOwnedWorkflowOrThrow(workflowId, userId);

  await prisma.workflow.delete({
    where: { id: workflowId },
  });
}