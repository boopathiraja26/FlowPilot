"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  GitFork,
  Layers,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import {
  getDashboardMetrics,
  isDashboardExecutionSummary,
  getRecentWorkflows,
  type DashboardExecutionSummary,
} from "@/lib/dashboardMetrics";
import { Workflow } from "@/types/workflow";
import { WorkflowExecution } from "@/types/execution";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not started";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof GitFork;
  iconClass: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
        <p className="mt-1 truncate text-xs text-slate-500" title={detail}>
          {detail}
        </p>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [executionSummary, setExecutionSummary] =
    useState<DashboardExecutionSummary>({
      totalExecutions: 0,
      completedExecutions: 0,
      failedExecutions: 0,
      queuedExecutions: 0,
      runningExecutions: 0,
      successRate: null,
    });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const [workflowResponse, summaryResponse, executionResponse] =
          await Promise.all([
            api.get("/workflows"),
            api.get("/analytics/dashboard-summary"),
            api.get("/executions?page=1&limit=5"),
          ]);
        const workflowData = workflowResponse.data?.data?.workflows;
        const summaryData = summaryResponse.data?.data?.summary;
        const executionData = executionResponse.data?.data?.executions;

        if (
          !Array.isArray(workflowData) ||
          !isDashboardExecutionSummary(summaryData) ||
          !Array.isArray(executionData)
        ) {
          throw new Error("The dashboard API returned an unexpected response.");
        }

        if (!isCancelled) {
          setWorkflows(workflowData as Workflow[]);
          setExecutionSummary(summaryData);
          setExecutions(executionData as WorkflowExecution[]);
        }
      } catch {
        if (!isCancelled) {
          setError("Couldn't load dashboard data. Check your connection and try again.");
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  const metrics = useMemo(
    () => getDashboardMetrics(workflows, executionSummary),
    [workflows, executionSummary]
  );
  const recentWorkflows = useMemo(
    () => getRecentWorkflows(workflows, 4),
    [workflows]
  );
  const recentExecutions = executions;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              An overview of your saved workflows and execution history.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/executions"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Activity className="h-4 w-4" />
              Execution history
            </Link>
            <Link
              href="/dashboard/workflows/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create workflow
            </Link>
          </div>
        </header>

        {error && !isLoading && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {(!error || isLoading) && (
          <section
            aria-label="Workflow and execution metrics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {isLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ))
            ) : (
              <>
                <MetricCard
                  label="Total workflows"
                  value={metrics.totalWorkflows}
                  detail={`${metrics.activeWorkflows} active · ${metrics.draftWorkflows} drafts · ${metrics.archivedWorkflows} archived`}
                  icon={GitFork}
                  iconClass="border-blue-100 bg-blue-50 text-blue-600"
                />
                <MetricCard
                  label="Active workflows"
                  value={metrics.activeWorkflows}
                  detail="Marked active in your workspace"
                  icon={Layers}
                  iconClass="border-emerald-100 bg-emerald-50 text-emerald-600"
                />
                <MetricCard
                  label="Total executions"
                  value={metrics.totalExecutions}
                  detail={`${metrics.queuedExecutions} queued · ${metrics.runningExecutions} running · ${metrics.failedExecutions} failed`}
                  icon={Activity}
                  iconClass="border-violet-100 bg-violet-50 text-violet-600"
                />
                <MetricCard
                  label="Success rate"
                  value={metrics.successRate === null ? "—" : `${metrics.successRate}%`}
                  detail={
                    metrics.completedExecutions + metrics.failedExecutions === 0
                      ? "No completed runs yet"
                      : `${metrics.completedExecutions} completed · ${metrics.failedExecutions} failed`
                  }
                  icon={CheckCircle2}
                  iconClass="border-teal-100 bg-teal-50 text-teal-600"
                />
              </>
            )}
          </section>
        )}

        {(!error || isLoading) && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent workflows</h2>
                <p className="mt-0.5 text-xs text-slate-500">Latest workflows in your account</p>
              </div>
              <Link
                href="/dashboard/workflows"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentWorkflows.length === 0 ? (
              <EmptyState
                title="No workflows yet"
                description="Create a workflow to start automating a process."
                actionLabel="Create workflow"
                onAction={() => router.push("/dashboard/workflows/new")}
                className="min-h-56"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentWorkflows.map((workflow) => (
                  <Link
                    key={workflow.id}
                    href={`/dashboard/workflows/${workflow.id}`}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {workflow.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {workflow.steps?.length ?? 0} steps · Created {formatDate(workflow.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={workflow.status} showIcon={false} />
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent activity</h2>
                <p className="mt-0.5 text-xs text-slate-500">Latest execution outcomes</p>
              </div>
              <Link
                href="/dashboard/executions"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                View history <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentExecutions.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <Clock3 className="h-8 w-8 text-slate-400" />
                <h3 className="mt-3 text-sm font-bold text-slate-800">No execution activity yet</h3>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                  Run a workflow from its builder to see real outcomes here.
                </p>
                <Link
                  href="/dashboard/workflows"
                  className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Browse workflows
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentExecutions.map((execution) => (
                  <Link
                    key={execution.id}
                    href={`/dashboard/executions/${execution.id}`}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {execution.workflow?.title ?? "Untitled workflow"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {execution.startedAt
                          ? `Started ${formatDateTime(execution.startedAt)}`
                          : `Queued ${formatDateTime(execution.createdAt)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={execution.status} showIcon={false} />
                      {execution.status === "FAILED" ? (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      ) : execution.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock3 className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
