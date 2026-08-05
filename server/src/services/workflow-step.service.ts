import {
  Prisma,
  WorkflowStep,
} from "@prisma/client";

import prisma from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";
import {
  CreateWorkflowStepInput,
  UpdateWorkflowStepInput,
} from "../validators/workflow-step.validation";

// =========================================================
// Helpers
// =========================================================

async function getOwnedWorkflow(
  workflowId: string,
  userId: string
) {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowId,
      userId,
    },
  });

  if (!workflow) {
    throw new ApiError(404, "Workflow not found");
  }

  return workflow;
}

async function getOwnedStep(
  stepId: string,
  userId: string
) {
  const step = await prisma.workflowStep.findFirst({
    where: {
      id: stepId,
      workflow: {
        userId,
      },
    },
  });

  if (!step) {
    throw new ApiError(404, "Workflow step not found");
  }

  return step;
}

// =========================================================
// Create Step
// =========================================================

export async function createWorkflowStep(
  workflowId: string,
  userId: string,
  input: CreateWorkflowStepInput
): Promise<WorkflowStep> {
  await getOwnedWorkflow(workflowId, userId);

  const count = await prisma.workflowStep.count({
    where: {
      workflowId,
    },
  });

  return prisma.workflowStep.create({
    data: {
      workflowId,
      name: input.name,
      type: input.type,
      config: (input.config ?? {}) as Prisma.JsonObject,
      stepOrder: count + 1,
    },
  });
}

// =========================================================
// Update Step
// =========================================================

export async function updateWorkflowStep(
  stepId: string,
  userId: string,
  input: UpdateWorkflowStepInput
): Promise<WorkflowStep> {
  await getOwnedStep(stepId, userId);

  return prisma.workflowStep.update({
    where: {
      id: stepId,
    },
    data: {
      ...(input.name !== undefined
        ? { name: input.name }
        : {}),

      ...(input.type !== undefined
        ? { type: input.type }
        : {}),

      ...(input.config !== undefined
        ? {
            config: input.config as Prisma.JsonObject,
          }
        : {}),
    },
  });
}

// =========================================================
// Delete Step
// =========================================================

export async function deleteWorkflowStep(
  stepId: string,
  userId: string
): Promise<void> {
  const step = await getOwnedStep(stepId, userId);

  await prisma.workflowStep.delete({
    where: {
      id: step.id,
    },
  });

  const remainingSteps =
    await prisma.workflowStep.findMany({
      where: {
        workflowId: step.workflowId,
      },
      orderBy: {
        stepOrder: "asc",
      },
    });

  for (let i = 0; i < remainingSteps.length; i++) {
    await prisma.workflowStep.update({
      where: {
        id: remainingSteps[i].id,
      },
      data: {
        stepOrder: i + 1,
      },
    });
  }
}

// =========================================================
// Reorder Steps
// =========================================================

export async function reorderWorkflowSteps(
  workflowId: string,
  userId: string,
  steps: {
    id: string;
    stepOrder: number;
  }[]
): Promise<void> {
  await getOwnedWorkflow(workflowId, userId);

  await prisma.$transaction(
    steps.map((step) =>
      prisma.workflowStep.update({
        where: {
          id: step.id,
        },
        data: {
          stepOrder: step.stepOrder,
        },
      })
    )
  );
}