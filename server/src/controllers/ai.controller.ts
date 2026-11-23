import { Request, Response } from "express";

import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../middleware/errorHandler";
import {
  generateWorkflowSchema,
  generateAndSaveWorkflowSchema,
} from "../validators/ai.validation";
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

  const parsed = generateAndSaveWorkflowSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.flatten().fieldErrors);
  }

  const generatedWorkflow =
    parsed.data.workflow ??
    (await generateWorkflowFromPrompt({ prompt: parsed.data.prompt! }));

  const normalizedWorkflow = {
    ...generatedWorkflow,
    title: generatedWorkflow.title.trim(),
    description:
      typeof generatedWorkflow.description === "string" && generatedWorkflow.description.trim().length > 0
        ? generatedWorkflow.description.trim()
        : null,
    steps: [...generatedWorkflow.steps]
      .sort((a, b) => a.order - b.order)
      .map((step, index) => ({
        ...step,
        order: index + 1,
        name: step.name.trim(),
        config:
          step.config && typeof step.config === "object" && !Array.isArray(step.config)
            ? (step.config as Record<string, unknown>)
            : {},
      })),
  };

  if (normalizedWorkflow.steps.length === 0) {
    throw new ApiError(400, "Validation failed", { workflow: ["A workflow must contain at least one step"] });
  }

  const savedWorkflow = await saveGeneratedWorkflow(userId, normalizedWorkflow);

  res.status(201).json({
    success: true,
    message: parsed.data.workflow
      ? "Workflow saved successfully"
      : "Workflow generated and saved successfully",
    data: { workflow: savedWorkflow },
  });
});