"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, ArrowRight, Filter } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { ExecutionPagination, WorkflowExecution } from "@/types/execution";

const PAGE_SIZE = 20;

function formatDateTime(isoDate: string | null): string {
  if (!isoDate) return "--";
  return new Date(isoDate).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "--";

  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (durationMs < 0) return "--";

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function ExecutionHistoryPage() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "QUEUED" | "COMPLETED" | "RUNNING" | "FAILED">("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ExecutionPagination | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchExecutions() {
      setIsLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (filter !== "ALL") query.set("status", filter);
        const response = await api.get(`/executions?${query.toString()}`);
        if (!isCancelled) {
          setExecutions(response.data.data.executions as WorkflowExecution[]);
          setPagination(response.data.data.pagination as ExecutionPagination);
        }
      } catch (err: any) {
        if (!isCancelled) {
          if (err?.response?.status === 401) {
            return;
          }
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
  }, [filter, page]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Execution Logs</h1>
              <span className="rounded-full bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30 shadow-[0_0_12px_-2px_rgba(59,130,246,0.3)]">
                {pagination?.total ?? 0} Matching Runs
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Browse persisted workflow runs, filter by outcome, and inspect step logs.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        {!isLoading && !error && (
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <Filter className="h-4 w-4 text-slate-500 mr-1" />
            {(["ALL", "QUEUED", "RUNNING", "COMPLETED", "FAILED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setPage(1);
                  setFilter(tab);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === tab
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                }`}
              >
                {tab === "ALL" ? "All Executions" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}

        {/* Loading Table */}
        {isLoading && (
          <div className="rounded-2xl border border-white/[0.08] bg-dark-900/90 p-6 space-y-4 shadow-card">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/60 p-5 text-rose-300 max-w-md shadow-card">
              <AlertCircle className="h-6 w-6 shrink-0 text-rose-400" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && pagination?.total === 0 && (
          <EmptyState
            title={filter === "ALL" ? "No execution history found" : "No matching executions"}
            description={
              filter === "ALL"
                ? "Run a workflow from the builder or trigger an event to see logs here."
                : "No runs match this status filter. Choose another status or run a workflow."
            }
            icon={Clock}
            actionLabel="View Workflows"
            onAction={() => window.location.href = "/dashboard/workflows"}
            className="py-16"
          />
        )}

        {/* Executions Table */}
        {!isLoading && !error && executions.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-dark-900/90 shadow-card animate-fade-in">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-dark-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Workflow Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Started At</th>
                  <th className="px-6 py-4">Completed At</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {executions.map((execution) => (
                  <tr
                    key={execution.id}
                    className="group transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-4 font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                      {execution.workflow?.title ?? "Untitled workflow"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={execution.status} />
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-400 font-mono">
                      {execution.startedAt
                        ? formatDateTime(execution.startedAt)
                        : `Queued ${formatDateTime(execution.createdAt)}`}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-400 font-mono">
                      {execution.completedAt ? formatDateTime(execution.completedAt) : "--"}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-blue-400">
                      {formatDuration(execution.startedAt, execution.completedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/executions/${execution.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-dark-850 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:bg-dark-800 hover:border-white/[0.16] hover:text-white"
                      >
                        <span>Inspect Log</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !error && pagination && pagination.total > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, pagination.total)}–
              {Math.min(page * PAGE_SIZE, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-white/[0.1] px-3 py-2 text-xs font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 text-xs text-slate-400">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1)
                  )
                }
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-white/[0.1] px-3 py-2 text-xs font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}