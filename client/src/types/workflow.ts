// =========================================================
// Enums (mirrors Prisma models on the backend exactly)
// =========================================================

export type WorkflowStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export const WorkflowStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const satisfies Record<string, WorkflowStatus>;

export type WorkflowStepType = "TRIGGER" | "AI" | "EMAIL" | "DELAY" | "WEBHOOK";

export const WorkflowStepType = {
  TRIGGER: "TRIGGER",
  AI: "AI",
  EMAIL: "EMAIL",
  DELAY: "DELAY",
  WEBHOOK: "WEBHOOK",
} as const satisfies Record<string, WorkflowStepType>;

// =========================================================
// WorkflowStep
// =========================================================

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  type: WorkflowStepType;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// =========================================================
// Workflow
// =========================================================

export interface Workflow {
  id: string;
  title: string;
  description: string | null;
  status: WorkflowStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  steps: WorkflowStep[];
}