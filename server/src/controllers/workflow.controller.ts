import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  workflowIdParamSchema,
} from "../validators/workflow.validation";
import {
  activateWorkflow,
  createWorkflow,
  deactivateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  getWorkflowById,
  getWorkflows,
  updateWorkflow,
} from "../services/workflow.service";
import { redactWorkflowSecrets } from "../utils/workflow-trigger";

// =========================================================
// Helpers
// =========================================================

function getUserId(req: Request): string {
  if (!req.user?.id) {
    throw new ApiError(401, "Authentication required");
  }
  return req.user.id;
}

function parseWorkflowId(req: Request) {
  const parsedParams = workflowIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ApiError(400, "Validation failed", parsedParams.error.flatten().fieldErrors);
  }
  return parsedParams.data.id;
}

// =========================================================
// POST /api/workflows
// =========================================================

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const parsed = createWorkflowSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const workflow = await createWorkflow(userId, parsed.data);

  res.status(201).json({
    success: true,
    message: "Workflow created successfully",
    data: { workflow: redactWorkflowSecrets(workflow) },
  });
});

// =========================================================
// GET /api/workflows
// =========================================================

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const workflows = await getWorkflows(userId);

  res.status(200).json({
    success: true,
    message: "Workflows retrieved successfully",
    data: { workflows: workflows.map((workflow) => redactWorkflowSecrets(workflow)) },
  });
});

// =========================================================
// GET /api/workflows/:id
// =========================================================

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const workflowId = parseWorkflowId(req);

  const workflow = await getWorkflowById(userId, workflowId);

  res.status(200).json({
    success: true,
    message: "Workflow retrieved successfully",
    data: { workflow: redactWorkflowSecrets(workflow) },
  });
});

// =========================================================
// PUT /api/workflows/:id
// =========================================================

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const workflowId = parseWorkflowId(req);

  const parsedBody = updateWorkflowSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new ApiError(400, "Validation failed", parsedBody.error.flatten().fieldErrors);
  }

  const workflow = await updateWorkflow(userId, workflowId, parsedBody.data);

  res.status(200).json({
    success: true,
    message: "Workflow updated successfully",
    data: { workflow: redactWorkflowSecrets(workflow) },
  });
});

// =========================================================
// DELETE /api/workflows/:id
// =========================================================

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const workflowId = parseWorkflowId(req);

  await deleteWorkflow(userId, workflowId);

  res.status(200).json({
    success: true,
    message: "Workflow deleted successfully",
  });
});

// =========================================================
// POST /api/workflows/:id/activate
// =========================================================

export const activate = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const workflowId = parseWorkflowId(req);

  const workflow = await activateWorkflow(userId, workflowId);

  res.status(200).json({
    success: true,
    message: "Workflow activated successfully",
    data: { workflow: redactWorkflowSecrets(workflow) },
  });
});

// =========================================================
// POST /api/workflows/:id/deactivate
// =========================================================

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const workflowId = parseWorkflowId(req);

  const workflow = await deactivateWorkflow(userId, workflowId);

  res.status(200).json({
    success: true,
    message: "Workflow deactivated successfully",
    data: { workflow: redactWorkflowSecrets(workflow) },
  });
});


// =========================================================
// POST /api/workflows/:id/duplicate
// =========================================================

export const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const workflowId = parseWorkflowId(req);

  const workflow = await duplicateWorkflow(userId, workflowId);

  res.status(201).json({
    success: true,
    message: "Workflow duplicated successfully",
    data: { workflow: redactWorkflowSecrets(workflow) },
  });
});
