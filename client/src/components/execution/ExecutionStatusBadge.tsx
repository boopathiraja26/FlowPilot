import { WorkflowExecutionStatus } from "@/types/execution";

const STATUS_STYLES: Record<WorkflowExecutionStatus, string> = {
  RUNNING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

interface ExecutionStatusBadgeProps {
  status: WorkflowExecutionStatus;
}

export function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
