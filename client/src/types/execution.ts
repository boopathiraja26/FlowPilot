export type WorkflowExecutionStatus =
  | "QUEUED"
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
  startedAt: string | null;
  completedAt: string | null;
  failureReason?: string | null;
  createdAt: string;
  logs?: ExecutionLog[];
}

export interface ExecutionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
