import { z } from "zod";

export const workflowIdParamSchema = z.object({
  workflowId: z.string().uuid(),
});

export const stepIdParamSchema = z.object({
  stepId: z.string().uuid(),
});

export const createWorkflowStepSchema = z.object({
  name: z.string().min(1).max(100),

  type: z.enum([
    "TRIGGER",
    "AI",
    "EMAIL",
    "DELAY",
    "WEBHOOK",
  ]),

  config: z.record(z.any()).optional(),
});

export const updateWorkflowStepSchema =
  createWorkflowStepSchema.partial();

export const reorderWorkflowStepsSchema = z.object({
  steps: z.array(
    z.object({
      id: z.string().uuid(),
      stepOrder: z.number().int().positive(),
    })
  ),
});

export type CreateWorkflowStepInput =
  z.infer<typeof createWorkflowStepSchema>;

export type UpdateWorkflowStepInput =
  z.infer<typeof updateWorkflowStepSchema>;

export type ReorderWorkflowStepsInput =
  z.infer<typeof reorderWorkflowStepsSchema>;