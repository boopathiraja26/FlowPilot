import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";

import {
  createWorkflowStep,
  updateWorkflowStep,
  deleteWorkflowStep,
  reorderWorkflowSteps,
} from "../services/workflow-step.service";

import {
  workflowIdParamSchema,
  stepIdParamSchema,
  createWorkflowStepSchema,
  updateWorkflowStepSchema,
  reorderWorkflowStepsSchema,
} from "../validators/workflow-step.validation";

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
// POST /api/workflows/:workflowId/steps
// =========================================================

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const params = workflowIdParamSchema.safeParse(req.params);

  if (!params.success) {
    throw new ApiError(
      400,
      "Validation failed",
      params.error.flatten().fieldErrors
    );
  }

  const body = createWorkflowStepSchema.safeParse(req.body);

  if (!body.success) {
    throw new ApiError(
      400,
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  }

  const step = await createWorkflowStep(
    params.data.workflowId,
    userId,
    body.data
  );

  res.status(201).json({
    success: true,
    message: "Workflow step created successfully",
    data: {
      step,
    },
  });
});

// =========================================================
// PUT /api/workflow-steps/:stepId
// =========================================================

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const params = stepIdParamSchema.safeParse(req.params);

  if (!params.success) {
    throw new ApiError(
      400,
      "Validation failed",
      params.error.flatten().fieldErrors
    );
  }

  const body = updateWorkflowStepSchema.safeParse(req.body);

  if (!body.success) {
    throw new ApiError(
      400,
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  }

  const step = await updateWorkflowStep(
    params.data.stepId,
    userId,
    body.data
  );

  res.status(200).json({
    success: true,
    message: "Workflow step updated successfully",
    data: {
      step,
    },
  });
});

// =========================================================
// DELETE /api/workflow-steps/:stepId
// =========================================================

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const params = stepIdParamSchema.safeParse(req.params);

  if (!params.success) {
    throw new ApiError(
      400,
      "Validation failed",
      params.error.flatten().fieldErrors
    );
  }

  await deleteWorkflowStep(params.data.stepId, userId);

  res.status(200).json({
    success: true,
    message: "Workflow step deleted successfully",
  });
});

// =========================================================
// PUT /api/workflows/:workflowId/steps/reorder
// =========================================================

export const reorder = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const params = workflowIdParamSchema.safeParse(req.params);

  if (!params.success) {
    throw new ApiError(
      400,
      "Validation failed",
      params.error.flatten().fieldErrors
    );
  }

  const body = reorderWorkflowStepsSchema.safeParse(req.body);

  if (!body.success) {
    throw new ApiError(
      400,
      "Validation failed",
      body.error.flatten().fieldErrors
    );
  }

  await reorderWorkflowSteps(
    params.data.workflowId,
    userId,
    body.data.steps
  );

  res.status(200).json({
    success: true,
    message: "Workflow steps reordered successfully",
  });
});