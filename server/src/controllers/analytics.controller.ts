import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import {
  getDashboardExecutionSummary,
  getWorkflowAnalytics,
} from "../services/analytics.service";
import { analyticsQuerySchema } from "../validators/analytics.validation";

export const getDashboardSummary = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new ApiError(401, "Authentication required");
    }

    const summary = await getDashboardExecutionSummary(req.user.id);
    res.status(200).json({
      success: true,
      data: { summary },
    });
  }
);

export const getSummary = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new ApiError(401, "Authentication required");
    }

    const parsed = analyticsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Analytics range is invalid.",
        parsed.error.flatten().fieldErrors
      );
    }

    const analytics = await getWorkflowAnalytics(
      req.user.id,
      parsed.data.days
    );
    res.status(200).json({
      success: true,
      data: { analytics },
    });
  }
);
