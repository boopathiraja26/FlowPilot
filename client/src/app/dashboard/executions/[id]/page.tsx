"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Activity, Terminal, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { WorkflowExecution } from "@/types/execution";

function formatDateTime(isoDate: string | null): string {
  if (!isoDate) return "--";

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
  if (!completedAt) return "--";

  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (durationMs < 0) return "--";

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function ExecutionDetailPage() {
  const params = useParams<{ id: string }>();
  const executionId = params?.id;
  const router = useRouter();

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
      } catch (err: any) {
        if (!isCancelled) {
          if (err?.response?.status === 401) {
            return;
          }
          setError("Couldn't load execution log details.");
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
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard/executions"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Executions</span>
        </Link>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!isLoading && error && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/60 p-5 text-rose-300 max-w-md shadow-card">
              <AlertCircle className="h-6 w-6 shrink-0 text-rose-400" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && execution && (
          <>
            {/* Execution summary card */}
            <div className="rounded-3xl border border-white/[0.08] bg-dark-900/90 p-6 sm:p-7 shadow-card backdrop-blur-xl animate-fade-in">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-extrabold text-white">
                      {execution.workflow?.title ?? "Untitled workflow"}
                    </h1>
                    <StatusBadge status={execution.status} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    Execution ID: {execution.id}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/[0.06] pt-5 sm:grid-cols-3">
                <div className="rounded-2xl bg-dark-950 p-4 border border-white/[0.06]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Started</p>
                  <p className="mt-1 text-xs font-mono font-semibold text-slate-200">{formatDateTime(execution.startedAt)}</p>
                </div>
                <div className="rounded-2xl bg-dark-950 p-4 border border-white/[0.06]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed</p>
                  <p className="mt-1 text-xs font-mono font-semibold text-slate-200">{formatDateTime(execution.completedAt)}</p>
                </div>
                <div className="rounded-2xl bg-dark-950 p-4 border border-white/[0.06]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Execution Duration</p>
                  <p className="mt-1 text-xs font-mono font-bold text-blue-400">
                    {formatDuration(execution.startedAt, execution.completedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Execution logs timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-blue-400" />
                  <span>Step Execution Timeline</span>
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  {logs.length} step {logs.length === 1 ? "log" : "logs"}
                </span>
              </div>

              {logs.length === 0 ? (
                <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-dark-900/60 text-center">
                  <p className="text-xs font-medium text-slate-400">No step logs recorded for this run.</p>
                </div>
              ) : (
                <div className="relative space-y-4 before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800 animate-fade-in">
                  {logs.map((log, index) => (
                    <div
                      key={log.id || index}
                      className="relative flex items-start gap-4 pl-12"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute left-4 top-4 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-dark-950 ring-4 ring-dark-800">
                        <span className={`h-2.5 w-2.5 rounded-full ${log.status === "COMPLETED" ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : log.status === "FAILED" ? "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]"}`} />
                      </div>

                      {/* Log card */}
                      <div className="flex-1 rounded-2xl border border-white/[0.08] bg-dark-900/90 p-5 shadow-card transition-all duration-200 hover:border-white/[0.16]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-950/70 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                                #{index + 1}
                              </span>
                              <h3 className="text-sm font-bold text-white">{log.stepName}</h3>
                            </div>
                            <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                              Type: {log.stepType}
                            </span>
                          </div>
                          <StatusBadge status={log.status} />
                        </div>

                        {log.message && (
                          <div className="mt-4 rounded-xl bg-dark-950 p-4 border border-white/[0.06] text-slate-100 shadow-inner">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                              <Terminal className="h-3.5 w-3.5 text-blue-400" />
                              <span>Step Output Stream</span>
                            </div>
                            <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-300 overflow-x-auto">
                              {log.message}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}