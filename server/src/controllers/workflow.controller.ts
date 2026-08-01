import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  workflowIdParamSchema,
} from "../validators/workflow.validation";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowById,
  getWorkflows,
  updateWorkflow,
} from "../services/workflow.service";

// =========================================================
// Helpers
// =========================================================

function getUserId(req: Request): string {
  if (!req.user?.id) {
    throw new ApiError(401, "Authentication required");
  }
  return req.user.id;
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
    data: { workflow },
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
    data: { workflows },
  });
});

// =========================================================
// GET /api/workflows/:id
// =========================================================

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const parsedParams = workflowIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ApiError(400, "Validation failed", parsedParams.error.flatten().fieldErrors);
  }

  const workflow = await getWorkflowById(userId, parsedParams.data.id);

  res.status(200).json({
    success: true,
    message: "Workflow retrieved successfully",
    data: { workflow },
  });
});

// =========================================================
// PUT /api/workflows/:id
// =========================================================

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const parsedParams = workflowIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ApiError(400, "Validation failed", parsedParams.error.flatten().fieldErrors);
  }

  const parsedBody = updateWorkflowSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new ApiError(400, "Validation failed", parsedBody.error.flatten().fieldErrors);
  }

  const workflow = await updateWorkflow(userId, parsedParams.data.id, parsedBody.data);

  res.status(200).json({
    success: true,
    message: "Workflow updated successfully",
    data: { workflow },
  });
});

// =========================================================
// DELETE /api/workflows/:id
// =========================================================

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const parsedParams = workflowIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ApiError(400, "Validation failed", parsedParams.error.flatten().fieldErrors);
  }

  await deleteWorkflow(userId, parsedParams.data.id);

  res.status(200).json({
    success: true,
    message: "Workflow deleted successfully",
  });
});