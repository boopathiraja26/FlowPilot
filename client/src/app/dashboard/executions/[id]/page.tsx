"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

function formatDateTime(isoDate: string | null): string {
  if (!isoDate) {
    return "--";
  }

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

export default function ExecutionDetailPage() {
  const params = useParams<{ id: string }>();
  const executionId = params?.id;

  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!executionId) return;

    let isCancelled = false;

    async function fetchExecution() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(`/executions/${executionId}`);
        if (!isCancelled) {
          setExecution(response.data.data.execution as WorkflowExecution);
        }
      } catch {
        if (!isCancelled) {
          setError("Couldn't load execution.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchExecution();

    return () => {
      isCancelled = true;
    };
  }, [executionId]);

  const logs = execution?.logs ?? [];

  return (
    <DashboardShell>
      {isLoading && (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
            <p className="text-sm">Loading execution...</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="max-w-sm rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && execution && (
        <>
          {/* Execution summary */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {execution.workflow?.title ?? "Untitled workflow"}
                </h1>
                <p className="mt-1 text-sm text-gray-500">Execution ID: {execution.id}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[execution.status]}`}
              >
                {execution.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Started
                </p>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(execution.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Completed
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTime(execution.completedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Duration
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDuration(execution.startedAt, execution.completedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Execution logs */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Execution Logs</h2>
          </div>

          {logs.length === 0 ? (
            <div className="flex h-[30vh] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
              <p className="text-sm font-medium text-gray-700">No execution logs found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{log.stepName}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{log.stepType}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[log.status]}`}
                    >
                      {log.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Started
                      </p>
                      <p className="mt-1 text-sm text-gray-700">{formatDateTime(log.startedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Completed
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {formatDateTime(log.completedAt)}
                      </p>
                    </div>
                  </div>

                  {log.message && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Message
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                        {log.message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}