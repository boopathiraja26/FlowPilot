// =========================================================
// Execution Status
// =========================================================

export type ExecutionStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

// =========================================================
// Step Status
// =========================================================

export type StepExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

// =========================================================
// Step Execution Result
// =========================================================

export interface StepExecutionResult {
  stepId: string;
  stepName: string;
  stepType: string;

  status: StepExecutionStatus;

  startedAt: Date;
  completedAt?: Date;

  message?: string;

  output?: Record<string, unknown>;
}

// =========================================================
// Workflow Execution Result
// =========================================================

export interface WorkflowExecutionResult {
  workflowId: string;

  status: ExecutionStatus;

  startedAt: Date | null;
  completedAt?: Date;

  durationMs?: number;

  steps: StepExecutionResult[];
}