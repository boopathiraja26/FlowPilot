export type WorkflowExecutionStatus =
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export interface ExecutionLog {
  id: string;
  executionId: string;
  stepName: string;
  stepType: string;
  status: WorkflowExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  message: string | null;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflow?: {
    id: string;
    title: string;
  };
  status: WorkflowExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  logs?: ExecutionLog[];
}