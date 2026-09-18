"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, AlertCircle, Clock, ArrowRight, Filter } from "lucide-react";

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
  const [filter, setFilter] = useState<"ALL" | "COMPLETED" | "RUNNING" | "FAILED">("ALL");

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
  }, []);

  const completedCount = executions.filter((e) => e.status === "COMPLETED").length;
  const failedCount = executions.filter((e) => e.status === "FAILED").length;
  const runningCount = executions.filter((e) => e.status === "RUNNING").length;

  const filteredExecutions = executions.filter((e) => {
    if (filter === "ALL") return true;
    return e.status === filter;
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Execution Logs</h1>
              <span className="rounded-full bg-blue-950/60 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30 shadow-[0_0_12px_-2px_rgba(59,130,246,0.3)]">
                {executions.length} Total Runs
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Real-time pipeline telemetry, status monitoring, and step-by-step logs.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        {!isLoading && !error && executions.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in">
            <div className="rounded-2xl border border-white/[0.08] bg-dark-900/90 p-5 shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Executions</p>
                <p className="mt-1 text-2xl font-black text-white">{executions.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950/60 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_-2px_rgba(59,130,246,0.3)]">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-dark-900/90 p-5 shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Successful Runs</p>
                <p className="mt-1 text-2xl font-black text-emerald-400">{completedCount}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_-2px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-dark-900/90 p-5 shadow-card flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Failed / Errors</p>
                <p className="mt-1 text-2xl font-black text-rose-400">{failedCount}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-950/60 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_-2px_rgba(244,63,94,0.3)]">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {!isLoading && !error && executions.length > 0 && (
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <Filter className="h-4 w-4 text-slate-500 mr-1" />
            {(["ALL", "COMPLETED", "RUNNING", "FAILED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
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
                {filteredExecutions.map((execution) => (
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
                      {formatDateTime(execution.startedAt)}
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
      </div>
    </DashboardShell>
  );
}