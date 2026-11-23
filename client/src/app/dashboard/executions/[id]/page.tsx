"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowLeft, CheckCircle2, Clock3, ExternalLink, Terminal, XCircle } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/PageState";
import { api } from "@/lib/api";
import { WorkflowExecution } from "@/types/execution";

function formatDateTime(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "In progress";
  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (durationMs < 0) return "—";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function ExecutionDetailPage() {
  const params = useParams<{ id: string }>();
  const executionId = params?.id;

  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchExecution() {
    if (!executionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/executions/${executionId}`);
      setExecution(response.data.data.execution as WorkflowExecution);
    } catch (err: any) {
      if (err?.response?.status === 401) return;
      setError("Unable to load execution details. The run may be unavailable or you may not have access.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!executionId) return;
    fetchExecution();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionId]);

  const logs = useMemo(() => execution?.logs ?? [], [execution?.logs]);

  const logStats = useMemo(() => {
    const completed = logs.filter((l) => l.status === "COMPLETED").length;
    const failed = logs.filter((l) => l.status === "FAILED").length;
    const running = logs.filter((l) => l.status === "RUNNING").length;
    return { completed, failed, running };
  }, [logs]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Link
              href="/dashboard/executions"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 focus-ring rounded-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to executions
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Execution details</h1>
            <p className="text-sm text-slate-600">Inspect run status, timing, and step-level output.</p>
          </div>
          {execution?.workflowId ? (
            <Link
              href={`/dashboard/workflows/${execution.workflowId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-ring"
            >
              Open workflow
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <InlineError title="Couldn't load execution" message={error} onRetry={fetchExecution} />
        ) : null}

        {!isLoading && !error && execution ? (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="truncate text-lg font-semibold text-slate-900">
                      {execution.workflow?.title ?? "Untitled workflow"}
                    </h2>
                    <StatusBadge status={execution.status} />
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-slate-500">Execution ID: {execution.id}</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {execution.status === "COMPLETED" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : execution.status === "FAILED" ? (
                    <XCircle className="h-4 w-4 text-rose-600" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="font-medium">
                    {execution.status === "COMPLETED"
                      ? "Run completed"
                      : execution.status === "FAILED"
                        ? "Run failed"
                        : "Run in progress"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Started</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(execution.startedAt)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Completed</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(execution.completedAt)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Duration</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDuration(execution.startedAt, execution.completedAt)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Step outcomes</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {logs.length === 0 ? "No logs yet" : `${logStats.completed} completed · ${logStats.failed} failed · ${logStats.running} running`}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Step timeline</h2>
                  <p className="text-sm text-slate-600">Ordered execution logs for each workflow step.</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                  {logs.length} {logs.length === 1 ? "log" : "logs"}
                </span>
              </div>

              {logs.length === 0 ? (
                <EmptyState
                  icon={Clock3}
                  title="No step logs recorded"
                  description="This execution does not have step-level logs yet. If it is still running, details may appear shortly."
                />
              ) : (
                <div className="space-y-3">
                  {logs.map((log, index) => (
                    <article
                      key={log.id || index}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 text-xs font-semibold text-slate-700">
                              {index + 1}
                            </span>
                            <h3 className="text-sm font-semibold text-slate-900">{log.stepName}</h3>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                              {log.stepType}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {log.startedAt ? `Started ${formatDateTime(log.startedAt)}` : "Start time unavailable"}
                            {log.completedAt ? ` · Completed ${formatDateTime(log.completedAt)}` : ""}
                          </p>
                        </div>
                        <StatusBadge status={log.status} />
                      </div>

                      {log.message ? (
                        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                          <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2 text-xs font-medium text-slate-300">
                            <Terminal className="h-3.5 w-3.5" />
                            <span>Step output</span>
                          </div>
                          <pre className="max-h-80 overflow-auto p-3 text-xs leading-relaxed text-slate-100 whitespace-pre-wrap break-words font-mono">
                            {log.message}
                          </pre>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}