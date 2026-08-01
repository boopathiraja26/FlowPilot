import { WorkflowStepType } from "@/types/workflow";

// =========================================================
// AI Generated Workflow Types
// Mirrors server/src/validators/ai.validation.ts
// =========================================================

export interface GeneratedWorkflowStep {
  order: number;
  type: WorkflowStepType;
  name: string;
  config: Record<string, unknown>;
}

export interface GeneratedWorkflow {
  title: string;
  description: string | null;
  steps: GeneratedWorkflowStep[];
}