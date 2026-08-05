"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api";
import { WorkflowExecution, WorkflowExecutionStatus } from "@/types/execution";

// =========================================================
// Status badge styles
// =========================================================

const STATUS_STYLES: Record<WorkflowExecutionStatus, string> = {
  RUNNING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

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

export default function ExecutionHistoryPage() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchExecutions() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get("/executions");
        if (!isCancelled) {
          setExecutions(response.data.data.executions as WorkflowExecution[]);
        }
      } catch {
        if (!isCancelled) {
          setError("Couldn't load execution history. Try again later.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchExecutions();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Execution History</h2>
        <p className="text-sm text-gray-500">View all workflow executions.</p>
      </div>

      {isLoading && (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
            <p className="text-sm">Loading executions...</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="max-w-sm rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && executions.length === 0 && (
        <div className="flex h-[50vh] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">No workflow executions yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Execute a workflow to see its history.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && executions.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Workflow</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((execution) => (
                <tr
                  key={execution.id}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {execution.workflow?.title ?? "Untitled workflow"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[execution.status]}`}
                    >
                      {execution.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatDateTime(execution.startedAt)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {execution.completedAt ? formatDateTime(execution.completedAt) : "--"}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatDuration(execution.startedAt, execution.completedAt)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/dashboard/executions/${execution.id}`}
                      className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}