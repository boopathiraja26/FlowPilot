import { Workflow, WorkflowStep } from "@prisma/client";

import { ApiError } from "../middleware/errorHandler";
import { CreateWorkflowInput, UpdateWorkflowInput } from "../validators/workflow.validation";
import prisma from "../lib/prisma";

// =========================================================
// Types
// =========================================================

export type WorkflowWithSteps = Workflow & { steps: WorkflowStep[] };

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

export async function getWorkflows(userId: string): Promise<WorkflowWithSteps[]> {
  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  return workflows;
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
  await findOwnedWorkflowOrThrow(workflowId, userId);

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