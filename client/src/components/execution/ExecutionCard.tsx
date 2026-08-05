import Link from "next/link";

import { WorkflowExecution } from "@/types/execution";
import { ExecutionStatusBadge } from "./ExecutionStatusBadge";

// =========================================================
// Helpers
// =========================================================

function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) {
    return "--";
  }

  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

  if (durationMs < 0) {
    return "--";
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

// =========================================================
// ExecutionCard
// =========================================================

interface ExecutionCardProps {
  execution: WorkflowExecution;
}

export function ExecutionCard({ execution }: ExecutionCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {execution.workflow?.title ?? "Untitled workflow"}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatDateTime(execution.startedAt)}
          </p>
        </div>
        <ExecutionStatusBadge status={execution.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Completed
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {execution.completedAt ? formatDateTime(execution.completedAt) : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Duration
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {formatDuration(execution.startedAt, execution.completedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <Link
          href={`/dashboard/executions/${execution.id}`}
          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
