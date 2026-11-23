"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Plus,
  RefreshCw,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError, PageLoadingState } from "@/components/ui/PageState";
import { api } from "@/lib/api";

type WorkflowStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type ExecutionStatus = "RUNNING" | "COMPLETED" | "FAILED";

interface DashboardSummary {
  workflows: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
  executions: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    successRate: number;
  };
  recentExecutions: Array<{
    id: string;
    workflowId: string;
    status: ExecutionStatus;
    startedAt: string;
    completedAt: string | null;
    workflow?: { id: string; title: string; status: WorkflowStatus } | null;
  }>;
  trend: Array<{
    date: string;
    total: number;
    completed: number;
    failed: number;
    running: number;
  }>;
  generatedAt: string;
}

function statusBadge(status: ExecutionStatus) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "RUNNING":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

function workflowStatusBadge(status?: WorkflowStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "ARCHIVED":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "DRAFT":
    default:
      return "bg-sky-50 text-sky-700 ring-sky-200";
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatDayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "slate" | "blue" | "emerald" | "rose" | "amber";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-900 text-white",
    blue: "bg-blue-600 text-white",
    emerald: "bg-emerald-600 text-white",
    rose: "bg-rose-600 text-white",
    amber: "bg-amber-500 text-white",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: DashboardSummary["trend"] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const totals = data.reduce(
    (acc, d) => {
      acc.total += d.total;
      acc.completed += d.completed;
      acc.failed += d.failed;
      acc.running += d.running;
      return acc;
    },
    { total: 0, completed: 0, failed: 0, running: 0 }
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Execution trend</h2>
          <p className="mt-1 text-sm text-slate-500">Workflow executions started in the last 7 days (UTC).</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Completed</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Failed</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Running</span>
        </div>
      </div>

      {totals.total === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">No execution activity in this period</p>
          <p className="mt-1 text-sm text-slate-500">Run a workflow to start building execution trends from real data.</p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex h-44 items-end gap-2 sm:gap-3">
            {data.map((day) => {
              const heightPct = day.total > 0 ? Math.max((day.total / max) * 100, 8) : 0;
              const completedPct = day.total > 0 ? (day.completed / day.total) * 100 : 0;
              const failedPct = day.total > 0 ? (day.failed / day.total) * 100 : 0;
              const runningPct = day.total > 0 ? (day.running / day.total) * 100 : 0;
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-36 w-full items-end justify-center">
                    {day.total === 0 ? (
                      <div className="h-1.5 w-full max-w-10 rounded-full bg-slate-100" title={`${formatDayLabel(day.date)}: 0 executions`} />
                    ) : (
                      <div
                        className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-md bg-slate-100"
                        style={{ height: `${heightPct}%` }}
                        title={`${formatDayLabel(day.date)} — Total ${day.total}, Completed ${day.completed}, Failed ${day.failed}, Running ${day.running}`}
                      >
                        {day.completed > 0 ? <div className="bg-emerald-500" style={{ height: `${completedPct}%` }} /> : null}
                        {day.failed > 0 ? <div className="bg-rose-500" style={{ height: `${failedPct}%` }} /> : null}
                        {day.running > 0 ? <div className="bg-amber-400" style={{ height: `${runningPct}%` }} /> : null}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-slate-500">{formatDayLabel(day.date)}</p>
                    <p className="text-xs font-semibold text-slate-700">{day.total}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
        <div><p className="text-xs text-slate-500">Total (7d)</p><p className="text-sm font-semibold text-slate-900">{totals.total}</p></div>
        <div><p className="text-xs text-slate-500">Completed</p><p className="text-sm font-semibold text-emerald-700">{totals.completed}</p></div>
        <div><p className="text-xs text-slate-500">Failed</p><p className="text-sm font-semibold text-rose-700">{totals.failed}</p></div>
        <div><p className="text-xs text-slate-500">Running</p><p className="text-sm font-semibold text-amber-700">{totals.running}</p></div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboard() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/executions/dashboard");
      setSummary((response.data.data as DashboardSummary) ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const hasData = useMemo(() => {
    if (!summary) return false;
    return summary.workflows.total > 0 || summary.executions.total > 0;
  }, [summary]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Overview</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Real-time workflow and execution health for your FlowPilot workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchDashboard}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-ring"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link
              href="/dashboard/workflows/new"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-ring"
            >
              <Plus className="h-4 w-4" />
              New workflow
            </Link>
          </div>
        </section>

        {error ? <InlineError title="Couldn’t load dashboard" message={error} onRetry={fetchDashboard} /> : null}

        {isLoading ? (
          <PageLoadingState label="Loading dashboard metrics and recent activity…" />
        ) : summary ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total workflows" value={summary.workflows.total} detail={`${summary.workflows.draft} draft · ${summary.workflows.archived} archived`} icon={Workflow} tone="slate" />
              <StatCard label="Active workflows" value={summary.workflows.active} detail={summary.workflows.active > 0 ? "Ready for triggers and runs" : "No workflows active yet"} icon={Zap} tone="blue" />
              <StatCard label="Execution success rate" value={`${summary.executions.successRate}%`} detail={`${summary.executions.completed} completed of ${summary.executions.total} total`} icon={CheckCircle2} tone="emerald" />
              <StatCard label="Failed executions" value={summary.executions.failed} detail={summary.executions.running > 0 ? `${summary.executions.running} currently running` : "No executions running"} icon={XCircle} tone={summary.executions.failed > 0 ? "rose" : "amber"} />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TrendChart data={summary.trend} />
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">Execution outcomes</h2>
                  <p className="mt-1 text-sm text-slate-500">All-time results for workflows you own.</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                      <span className="inline-flex items-center gap-2 text-sm text-slate-700"><PlayCircle className="h-4 w-4 text-slate-500" />Total executions</span>
                      <span className="text-sm font-semibold text-slate-900">{summary.executions.total}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
                      <span className="inline-flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />Completed</span>
                      <span className="text-sm font-semibold text-emerald-800">{summary.executions.completed}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2.5">
                      <span className="inline-flex items-center gap-2 text-sm text-rose-800"><XCircle className="h-4 w-4" />Failed</span>
                      <span className="text-sm font-semibold text-rose-800">{summary.executions.failed}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5">
                      <span className="inline-flex items-center gap-2 text-sm text-amber-800"><Clock3 className="h-4 w-4" />Running</span>
                      <span className="text-sm font-semibold text-amber-800">{summary.executions.running}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
                  <p className="mt-1 text-sm text-slate-500">Common tasks for managing automation.</p>
                  <div className="mt-4 grid gap-2">
                    <Link href="/dashboard/workflows/new" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-ring">
                      <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4 text-slate-500" />Create workflow</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                    <Link href="/dashboard/workflows" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-ring">
                      <span className="inline-flex items-center gap-2"><Workflow className="h-4 w-4 text-slate-500" />Manage workflows</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                    <Link href="/dashboard/executions" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-ring">
                      <span className="inline-flex items-center gap-2"><Activity className="h-4 w-4 text-slate-500" />View execution history</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recent execution activity</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Latest workflow runs across your workspace.</p>
                </div>
                <Link href="/dashboard/executions" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {summary.recentExecutions.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Activity}
                    title={hasData ? "No executions recorded yet" : "Welcome to FlowPilot"}
                    description={hasData
                      ? "Your workflows are set up, but there is no execution history yet. Run a workflow or trigger it to see real activity here."
                      : "Create your first workflow to start automating processes and tracking execution metrics, trends, and activity."}
                    actionLabel={hasData ? "Open workflows" : "Create workflow"}
                    onAction={() => {
                      window.location.href = hasData ? "/dashboard/workflows" : "/dashboard/workflows/new";
                    }}
                    secondaryActionLabel={hasData ? "View executions" : undefined}
                    onSecondaryAction={hasData ? () => { window.location.href = "/dashboard/executions"; } : undefined}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow status</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Execution</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Started</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {summary.recentExecutions.map((execution) => (
                        <tr key={execution.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">{execution.workflow?.title || "Workflow"}</p>
                              <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{execution.workflowId}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${workflowStatusBadge(execution.workflow?.status)}`}>
                              {execution.workflow?.status || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge(execution.status)}`}>
                              {execution.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDate(execution.startedAt)}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDate(execution.completedAt)}</td>
                          <td className="px-5 py-4 text-right">
                            <Link href={`/dashboard/executions/${execution.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-ring">
                              Open <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <p className="text-xs text-slate-500">Data source: real workflow and execution records for the authenticated workspace (PostgreSQL-backed APIs). Last refreshed: {formatDate(summary.generatedAt)}.</p>
          </>
        ) : (
          <EmptyState
            icon={Activity}
            title="Dashboard unavailable"
            description="No dashboard data was returned. Refresh to try again."
            actionLabel="Refresh"
            onAction={fetchDashboard}
          />
        )}
      </div>
    </DashboardShell>
  );
}