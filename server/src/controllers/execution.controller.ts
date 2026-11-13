import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import {
  enqueueWorkflow,
  executeWorkflow,
  getExecution,
  getExecutions,
} from "../services/execution.service";
import { parseExecutionListQuery } from "../utils/executionQuery";

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

export const enqueue = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const execution = await enqueueWorkflow(
    req.params.workflowId,
    userId,
    req.body
  );

  res.status(202).json({
    success: true,
    message: "Workflow execution queued.",
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

  const isPaginatedRequest = Object.keys(req.query).length > 0;
  const parsedQuery = isPaginatedRequest
    ? parseExecutionListQuery(req.query)
    : null;
  if (parsedQuery && !parsedQuery.success) {
    throw new ApiError(
      400,
      "Invalid execution history query.",
      parsedQuery.error.flatten().fieldErrors
    );
  }

  const result = await getExecutions(userId, parsedQuery?.data);
  const executions = Array.isArray(result) ? result : result.executions;
  const pagination = Array.isArray(result) ? undefined : result.pagination;

  res.status(200).json({
    success: true,
    data: {
      executions,
      ...(pagination ? { pagination } : {}),
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