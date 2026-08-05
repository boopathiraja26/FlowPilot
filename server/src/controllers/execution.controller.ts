import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import {
  executeWorkflow,
  getExecution,
  getExecutions,
} from "../services/execution.service";

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
// POST /api/executions/:workflowId
// =========================================================

export const execute = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const execution = await executeWorkflow(
    req.params.workflowId,
    userId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Workflow executed successfully.",
    data: {
      execution,
    },
  });
});

// =========================================================
// GET /api/executions
// =========================================================

export const findAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const executions = await getExecutions(userId);

  res.status(200).json({
    success: true,
    data: {
      executions,
    },
  });
});

// =========================================================
// GET /api/executions/:id
// =========================================================

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const execution = await getExecution(
    req.params.id,
    userId
  );

  res.status(200).json({
    success: true,
    data: {
      execution,
    },
  });
});