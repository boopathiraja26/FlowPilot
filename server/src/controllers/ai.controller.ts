import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import { generateWorkflowSchema } from "../validators/ai.validation";
import {
  generateWorkflowFromPrompt,
  saveGeneratedWorkflow,
} from "../services/ai.service";

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
// POST /api/ai/generate
// =========================================================

export const generate = asyncHandler(async (req: Request, res: Response) => {
  getUserId(req);

  const parsed = generateWorkflowSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const workflow = await generateWorkflowFromPrompt(parsed.data);

  res.status(200).json({
    success: true,
    message: "Workflow generated successfully",
    data: { workflow },
  });
});

// =========================================================
// POST /api/ai/generate-and-save
// =========================================================

export const generateAndSave = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const parsed = generateWorkflowSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const generatedWorkflow = await generateWorkflowFromPrompt(parsed.data);
  const savedWorkflow = await saveGeneratedWorkflow(userId, generatedWorkflow);

  res.status(201).json({
    success: true,
    message: "Workflow generated and saved successfully",
    data: { workflow: savedWorkflow },
  });
});