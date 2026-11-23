"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, AlertCircle, ArrowRight, CheckCircle2, Clock3, Filter, PlayCircle, XCircle } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/PageState";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { WorkflowExecution } from "@/types/execution";

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
  if (!completedAt) return "—";
  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (durationMs < 0) return "—";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

type StatusFilter = "ALL" | "COMPLETED" | "RUNNING" | "FAILED";

export default function ExecutionHistoryPage() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  async function fetchExecutions() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/executions");
      setExecutions((response.data.data.executions as WorkflowExecution[]) ?? []);
    } catch (err: any) {
      if (err?.response?.status === 401) return;
      setError("Unable to load execution history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchExecutions();
  }, []);

  const stats = useMemo(() => {
    const completed = executions.filter((e) => e.status === "COMPLETED").length;
    const failed = executions.filter((e) => e.status === "FAILED").length;
    const running = executions.filter((e) => e.status === "RUNNING").length;
    return { total: executions.length, completed, failed, running };
  }, [executions]);

  const filteredExecutions = useMemo(() => {
    if (filter === "ALL") return executions;
    return executions.filter((e) => e.status === filter);
  }, [executions, filter]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Monitoring</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Executions</h1>
            <p className="text-sm text-slate-600">
              Review workflow runs, outcomes, and durations across your workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {stats.total} total runs
            </span>
          </div>
        </div>

        {error ? <InlineError title="Couldn’t load executions" message={error} onRetry={fetchExecutions} /> : null}

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <TableSkeleton rows={6} />
          </div>
        ) : null}

        {!isLoading && !error && executions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Total runs</p>
                  <Activity className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.total}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Completed</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.completed}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Running</p>
                  <PlayCircle className="h-4 w-4 text-blue-500" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.running}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Failed</p>
                  <XCircle className="h-4 w-4 text-rose-500" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.failed}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 pr-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Filter className="h-3.5 w-3.5" /> Filter
              </span>
              {(["ALL", "RUNNING", "COMPLETED", "FAILED"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-ring ${
                    filter === tab
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 sm:px-6">Workflow</th>
                      <th className="px-4 py-3 sm:px-6">Status</th>
                      <th className="px-4 py-3 sm:px-6">Started</th>
                      <th className="px-4 py-3 sm:px-6">Completed</th>
                      <th className="px-4 py-3 sm:px-6">Duration</th>
                      <th className="px-4 py-3 text-right sm:px-6">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExecutions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                          No executions match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredExecutions.map((execution) => (
                        <tr key={execution.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-4 py-4 sm:px-6">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {execution.workflow?.title ?? "Untitled workflow"}
                              </p>
                              <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                                {execution.id}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 sm:px-6">
                            <StatusBadge status={execution.status} />
                          </td>
                          <td className="px-4 py-4 text-slate-600 sm:px-6">{formatDateTime(execution.startedAt)}</td>
                          <td className="px-4 py-4 text-slate-600 sm:px-6">
                            {execution.completedAt ? formatDateTime(execution.completedAt) : "—"}
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-700 sm:px-6">
                            {formatDuration(execution.startedAt, execution.completedAt)}
                          </td>
                          <td className="px-4 py-4 text-right sm:px-6">
                            <Link
                              href={`/dashboard/executions/${execution.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-ring"
                            >
                              View
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

        {!isLoading && !error && executions.length === 0 ? (
          <EmptyState
            icon={Clock3}
            title="No executions yet"
            description="When workflows run, their execution history, status, and timing will appear here."
            actionLabel="Go to workflows"
            onAction={() => {
              window.location.href = "/dashboard/workflows";
            }}
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}
