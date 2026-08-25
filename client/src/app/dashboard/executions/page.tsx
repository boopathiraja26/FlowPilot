"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
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
  if (!completedAt) return "--";

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

  const completedCount = executions.filter((e) => e.status === "COMPLETED").length;
  const failedCount = executions.filter((e) => e.status === "FAILED").length;
  const runningCount = executions.filter((e) => e.status === "RUNNING").length;

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Execution Logs</h2>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 border border-brand-100">
              {executions.length} Total Runs
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time pipeline monitoring, status tracking, and step-by-step logs.
          </p>
        </div>

        {/* Stats Row */}
        {!isLoading && !error && executions.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Executions</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{executions.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Successful Runs</p>
                <p className="mt-1 text-2xl font-black text-emerald-600">{completedCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Failed / Errors</p>
                <p className="mt-1 text-2xl font-black text-rose-600">{failedCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {/* Loading Table */}
        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 max-w-md shadow-sm">
              <AlertCircle className="h-6 w-6 shrink-0 text-rose-600" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && executions.length === 0 && (
          <EmptyState
            title="No execution history found"
            description="Run a workflow from the builder or trigger an event to see logs here."
            icon={Clock}
            actionLabel="View Workflows"
            onAction={() => window.location.href = "/dashboard/workflows"}
            className="py-16"
          />
        )}

        {/* Executions Table */}
        {!isLoading && !error && executions.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-subtle animate-fade-in">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5">Workflow Name</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Started At</th>
                  <th className="px-6 py-3.5">Completed At</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {executions.map((execution) => (
                  <tr
                    key={execution.id}
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {execution.workflow?.title ?? "Untitled workflow"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={execution.status} />
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {formatDateTime(execution.startedAt)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {execution.completedAt ? formatDateTime(execution.completedAt) : "--"}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-semibold text-slate-700">
                      {formatDuration(execution.startedAt, execution.completedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/executions/${execution.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 active:scale-[0.98]"
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
      </div>
    </DashboardShell>
  );
}