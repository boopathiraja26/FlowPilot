import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { executeWorkflowFromWebhook } from "../services/execution.service";
import { extractWebhookSecret } from "../utils/workflow-trigger";
import { workflowIdParamSchema } from "../validators/workflow.validation";

export const receiveWebhookTrigger = asyncHandler(async (req: Request, res: Response) => {
  const parsedParams = workflowIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ApiError(400, "Validation failed", parsedParams.error.flatten().fieldErrors);
  }

  const providedSecret = extractWebhookSecret({
    headers: req.headers as Record<string, unknown>,
  });

  const payload =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};

  const execution = await executeWorkflowFromWebhook(parsedParams.data.id, providedSecret, payload);

  res.status(202).json({
    success: true,
    message: "Webhook trigger accepted",
    data: {
      executionId: execution.id,
      status: execution.status,
    },
  });
});
