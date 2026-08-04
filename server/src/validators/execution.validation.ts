import { z } from "zod";

// =========================================================
// Run Workflow
// =========================================================

export const runWorkflowSchema = z.object({
  workflowId: z.string().uuid(),
});

export type RunWorkflowInput = z.infer<typeof runWorkflowSchema>;