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
import {
  generateWebhookSecret,
  mergeTriggerConfigPreservingSecret,
} from "../utils/workflow-trigger";

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
  const existingStep = await getOwnedStep(stepId, userId);

  const mergedConfig =
    input.config !== undefined
      ? mergeTriggerConfigPreservingSecret(input.config, existingStep.config)
      : undefined;

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

      ...(mergedConfig !== undefined
        ? {
            config: mergedConfig as Prisma.JsonObject,
          }
        : {}),
    },
  });
}

export async function rotateWorkflowStepWebhookSecret(
  stepId: string,
  userId: string
): Promise<{ step: WorkflowStep; webhookSecret: string }> {
  const existingStep = await getOwnedStep(stepId, userId);

  if (existingStep.type !== "TRIGGER") {
    throw new ApiError(400, "Webhook secret rotation is only available for TRIGGER steps");
  }

  const webhookSecret = generateWebhookSecret();
  const existingConfig =
    existingStep.config && typeof existingStep.config === "object" && !Array.isArray(existingStep.config)
      ? ({ ...(existingStep.config as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const updatedStep = await prisma.workflowStep.update({
    where: { id: stepId },
    data: {
      config: {
        ...existingConfig,
        triggerMode: "webhook",
        webhookSecret,
      } as Prisma.JsonObject,
    },
  });

  return { step: updatedStep, webhookSecret };
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

  const existingSteps = await prisma.workflowStep.findMany({
    where: { workflowId },
    select: { id: true },
    orderBy: { stepOrder: "asc" },
  });

  if (steps.length !== existingSteps.length) {
    throw new ApiError(400, "Invalid reorder payload: include every workflow step exactly once.");
  }

  const existingIds = new Set(existingSteps.map((s) => s.id));
  const seenIds = new Set<string>();
  const seenOrders = new Set<number>();
  const expectedOrders = new Set(existingSteps.map((_s, index) => index + 1));

  for (const step of steps) {
    if (!existingIds.has(step.id)) {
      throw new ApiError(400, "Invalid reorder payload: step does not belong to this workflow.");
    }
    if (seenIds.has(step.id)) {
      throw new ApiError(400, "Invalid reorder payload: duplicate step IDs are not allowed.");
    }
    if (seenOrders.has(step.stepOrder)) {
      throw new ApiError(400, "Invalid reorder payload: duplicate step positions are not allowed.");
    }
    if (!expectedOrders.has(step.stepOrder)) {
      throw new ApiError(400, "Invalid reorder payload: step positions must form a contiguous sequence.");
    }
    seenIds.add(step.id);
    seenOrders.add(step.stepOrder);
  }

  await prisma.$transaction(
    steps.map((step) =>
      prisma.workflowStep.update({
        where: {
          id: step.id,
          workflowId,
        },
        data: {
          stepOrder: step.stepOrder,
        },
      })
    )
  );
}