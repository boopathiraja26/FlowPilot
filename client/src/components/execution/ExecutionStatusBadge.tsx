import { WorkflowExecutionStatus } from "@/types/execution";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ExecutionStatusBadgeProps {
  status: WorkflowExecutionStatus;
  className?: string;
}

export function ExecutionStatusBadge({ status, className }: ExecutionStatusBadgeProps) {
  return <StatusBadge status={status} className={className} />;
}

