"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api";

type RangeDays = 7 | 30 | 90;

interface DailyAnalytics {
  date: string;
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
}

interface WorkflowAnalytics {
  days: RangeDays;
  startDate: string;
  endDate: string;
  totals: {
    total: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    successRatePercent: number | null;
    averageDurationMs: number | null;
  };
  daily: DailyAnalytics[];
}

function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null) return "—";
  if (milliseconds < 1000) return `${milliseconds} ms`;
  if (milliseconds < 60_000) return `${(milliseconds / 1000).toFixed(1)} sec`;
  return `${(milliseconds / 60_000).toFixed(1)} min`;
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof Activity;
  color: string;
}) {
  return (
    <article className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
        <p className="mt-1 truncate text-xs text-slate-500" title={description}>{description}</p>
      </div>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </span>
    </article>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/analytics?days=${days}`);
        const data = response.data?.data?.analytics;
        if (!data || !Array.isArray(data.daily) || !data.totals) {
          throw new Error("Unexpected analytics response");
        }
        if (!cancelled) setAnalytics(data as WorkflowAnalytics);
      } catch {
        if (!cancelled) {
          setError("Could not load analytics. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [days, reloadKey]);

  const maxDailyTotal = Math.max(
    1,
    ...(analytics?.daily.map((day) => day.total) ?? [])
  );

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Analytics</h1>
            <p className="mt-1 text-sm text-slate-500">
              Execution outcomes and duration calculated from your persisted workflow runs.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            Range
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value) as RangeDays)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
        </header>

        {error && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold hover:bg-rose-100 sm:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        <section aria-label="Execution metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))
          ) : analytics ? (
            <>
              <MetricCard
                label="Executions"
                value={analytics.totals.total}
                description={`In the last ${analytics.days} days`}
                icon={Activity}
                color="bg-blue-50 text-blue-700"
              />
              <MetricCard
                label="Success rate"
                value={analytics.totals.successRatePercent === null ? "—" : `${analytics.totals.successRatePercent}%`}
                description={`${analytics.totals.completed} completed · ${analytics.totals.failed} failed`}
                icon={CheckCircle2}
                color="bg-emerald-50 text-emerald-700"
              />
              <MetricCard
                label="Failed runs"
                value={analytics.totals.failed}
                description={`${analytics.totals.queued} queued · ${analytics.totals.running} running`}
                icon={XCircle}
                color="bg-rose-50 text-rose-700"
              />
              <MetricCard
                label="Average duration"
                value={formatDuration(analytics.totals.averageDurationMs)}
                description="Completed runs with timestamps"
                icon={Clock3}
                color="bg-violet-50 text-violet-700"
              />
            </>
          ) : null}
        </section>

        {!isLoading && analytics && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Daily executions</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Stacked by persisted execution status, {new Date(analytics.startDate).toLocaleDateString()}–{new Date(analytics.endDate).toLocaleDateString()}.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                <BarChart3 className="h-4 w-4" />
                {analytics.totals.total} total runs
              </span>
            </div>

            {analytics.totals.total === 0 ? (
              <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <Activity className="h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-bold text-slate-800">No executions in this range</p>
                <p className="mt-1 text-xs text-slate-500">Run a workflow to populate analytics with real results.</p>
              </div>
            ) : (
              <>
                <div className="mt-6 overflow-x-auto pb-2">
                  <div
                    role="img"
                    aria-label={`Daily executions for the last ${analytics.days} days, stacked by status`}
                    className="grid h-48 min-w-[700px] items-end gap-1 border-b border-slate-200 px-1"
                    style={{ gridTemplateColumns: `repeat(${analytics.daily.length}, minmax(0, 1fr))` }}
                  >
                    {analytics.daily.map((day) => (
                      <div key={day.date} className="group relative flex h-full items-end" title={`${day.date}: ${day.total} executions (${day.completed} completed, ${day.failed} failed)`}>
                        <div className="flex h-full w-full flex-col-reverse overflow-hidden rounded-t-sm">
                          {([
                            ["queued", day.queued, "bg-blue-300"],
                            ["running", day.running, "bg-violet-400"],
                            ["completed", day.completed, "bg-emerald-500"],
                            ["failed", day.failed, "bg-rose-500"],
                          ] as const).map(([status, count, color]) => (
                            count > 0 ? (
                              <div
                                key={status}
                                className={`min-h-[2px] w-full ${color}`}
                                style={{ height: `${(count / maxDailyTotal) * 100}%` }}
                              />
                            ) : null
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                    <span>{analytics.daily[0]?.date}</span>
                    <span>{analytics.daily[analytics.daily.length - 1]?.date}</span>
                  </div>
                </div>

                <div role="group" aria-label="Execution status legend" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                  <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Completed</span>
                  <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Failed</span>
                  <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-violet-400" />Running</span>
                  <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-blue-300" />Queued</span>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <caption className="sr-only">Daily workflow execution counts by status</caption>
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-semibold">Date</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold">Total</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold">Completed</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold">Failed</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold">Queued / running</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...analytics.daily].reverse().map((day) => (
                        <tr key={day.date}>
                          <th scope="row" className="px-3 py-2 font-medium text-slate-700">{day.date}</th>
                          <td className="px-3 py-2 text-right text-slate-700">{day.total}</td>
                          <td className="px-3 py-2 text-right text-emerald-700">{day.completed}</td>
                          <td className="px-3 py-2 text-right text-rose-700">{day.failed}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{day.queued + day.running}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
