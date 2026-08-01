import { PrismaClient, Workflow } from "@prisma/client";

import { ApiError } from "../middleware/errorHandler";
import { CreateWorkflowInput, UpdateWorkflowInput } from "../validators/workflow.validation";

const prisma = new PrismaClient();

// =========================================================
// Helpers
// =========================================================

async function findOwnedWorkflowOrThrow(
  workflowId: string,
  userId: string
): Promise<Workflow> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
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
): Promise<Workflow> {
  const workflow = await prisma.workflow.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "DRAFT",
      userId,
    },
  });

  return workflow;
}

// =========================================================
// getWorkflows
// =========================================================

export async function getWorkflows(userId: string): Promise<Workflow[]> {
  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return workflows;
}

// =========================================================
// getWorkflowById
// =========================================================

export async function getWorkflowById(
  userId: string,
  workflowId: string
): Promise<Workflow> {
  return findOwnedWorkflowOrThrow(workflowId, userId);
}

// =========================================================
// updateWorkflow
// =========================================================

export async function updateWorkflow(
  userId: string,
  workflowId: string,
  input: UpdateWorkflowInput
): Promise<Workflow> {
  await findOwnedWorkflowOrThrow(workflowId, userId);

  const updatedWorkflow = await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
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