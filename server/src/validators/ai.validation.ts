import { z } from "zod";

// =========================================================
// Enums (mirrors Prisma WorkflowStepType)
// =========================================================

export const workflowStepTypeEnum = z.enum([
  "TRIGGER",
  "AI",
  "EMAIL",
  "DELAY",
  "WEBHOOK",
]);

// =========================================================
// Request: POST /api/ai/generate
// =========================================================

export const generateWorkflowSchema = z.object({
  prompt: z
    .string({ required_error: "Prompt is required" })
    .trim()
    .min(5, "Prompt must be at least 5 characters long")
    .max(1000, "Prompt must not exceed 1000 characters"),
});

export type GenerateWorkflowInput = z.infer<typeof generateWorkflowSchema>;

// =========================================================
// AI-generated workflow shape (validated after Gemini responds)
// =========================================================

export const generatedWorkflowStepSchema = z.object({
  order: z
    .number({ required_error: "Step order is required" })
    .int("Step order must be an integer")
    .min(1, "Step order must be at least 1"),
  type: workflowStepTypeEnum,
  name: z
    .string({ required_error: "Step name is required" })
    .trim()
    .min(1, "Step name is required")
    .max(100, "Step name must not exceed 100 characters"),
  config: z.record(z.string(), z.unknown()),
});

export type GeneratedWorkflowStep = z.infer<typeof generatedWorkflowStepSchema>;

export const generatedWorkflowSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title must not exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .nullable()
    .optional(),
  steps: z
    .array(generatedWorkflowStepSchema)
    .min(1, "A workflow must contain at least one step"),
});

export type GeneratedWorkflow = z.infer<typeof generatedWorkflowSchema>;