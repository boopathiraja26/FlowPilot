import { Prisma } from "@prisma/client";

import prisma from "../lib/prisma";

interface AnalyticsAggregateRow {
  date: Date;
  status: string;
  count: number;
  durationCount: number;
  averageDurationMs: number | null;
}

interface DashboardExecutionAggregateRow {
  status: string;
  count: number;
}

export interface DashboardExecutionSummary {
  totalExecutions: number;
  queuedExecutions: number;
  runningExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  successRate: number | null;
}

interface DailyAnalytics {
  date: string;
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
}

interface AnalyticsTotals {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  successRatePercent: number | null;
  averageDurationMs: number | null;
}

export interface WorkflowAnalytics {
  days: number;
  startDate: string;
  endDate: string;
  totals: AnalyticsTotals;
  daily: DailyAnalytics[];
}

export function buildDashboardExecutionSummary(
  rows: DashboardExecutionAggregateRow[]
): DashboardExecutionSummary {
  const summary: DashboardExecutionSummary = {
    totalExecutions: 0,
    queuedExecutions: 0,
    runningExecutions: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    successRate: null,
  };

  for (const row of rows) {
    if (!Number.isSafeInteger(row.count) || row.count < 0) {
      throw new Error(
        "Dashboard aggregation returned an invalid execution count."
      );
    }

    switch (row.status) {
      case "QUEUED":
        summary.queuedExecutions += row.count;
        break;
      case "RUNNING":
        summary.runningExecutions += row.count;
        break;
      case "COMPLETED":
        summary.completedExecutions += row.count;
        break;
      case "FAILED":
        summary.failedExecutions += row.count;
        break;
      default:
        throw new Error(
          "Dashboard aggregation returned an unsupported execution status."
        );
    }
    summary.totalExecutions += row.count;
  }

  const terminalCount =
    summary.completedExecutions + summary.failedExecutions;
  summary.successRate =
    terminalCount === 0
      ? null
      : Math.round((summary.completedExecutions / terminalCount) * 1000) / 10;

  return summary;
}

export function buildDashboardExecutionSummaryQuery(
  userId: string
): Prisma.Sql {
  return Prisma.sql`
    SELECT
      execution."status"::text AS "status",
      COUNT(*)::int AS "count"
    FROM "public"."workflow_executions" AS execution
    INNER JOIN "public"."workflows" AS workflow
      ON workflow."id" = execution."workflowId"
    WHERE workflow."userId" = ${userId}
    GROUP BY execution."status"
  `;
}

export async function getDashboardExecutionSummary(
  userId: string
): Promise<DashboardExecutionSummary> {
  const rows = await prisma.$queryRaw<DashboardExecutionAggregateRow[]>(
    buildDashboardExecutionSummaryQuery(userId)
  );
  return buildDashboardExecutionSummary(rows);
}

export function getAnalyticsStartDate(now: Date, days: number): Date {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

export function buildWorkflowAnalytics(
  rows: AnalyticsAggregateRow[],
  days: number,
  now: Date
): WorkflowAnalytics {
  const startDate = getAnalyticsStartDate(now, days);
  const dailyByDate = new Map<string, DailyAnalytics>();

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + offset);
    const key = date.toISOString().slice(0, 10);
    dailyByDate.set(key, {
      date: key,
      total: 0,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
    });
  }

  const totals: AnalyticsTotals = {
    total: 0,
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0,
    successRatePercent: null,
    averageDurationMs: null,
  };
  let durationTotalMs = 0;
  let durationSamples = 0;

  for (const row of rows) {
    const dateKey = new Date(row.date).toISOString().slice(0, 10);
    const daily = dailyByDate.get(dateKey);
    if (!daily) continue;

    if (
      row.status !== "QUEUED" &&
      row.status !== "RUNNING" &&
      row.status !== "COMPLETED" &&
      row.status !== "FAILED"
    ) {
      throw new Error("Analytics query returned an unsupported execution status.");
    }

    daily.total += row.count;
    daily[row.status.toLowerCase() as "queued" | "running" | "completed" | "failed"] +=
      row.count;
    totals.total += row.count;
    totals[row.status.toLowerCase() as "queued" | "running" | "completed" | "failed"] +=
      row.count;

    if (row.status === "COMPLETED" && row.averageDurationMs !== null) {
      durationTotalMs += row.averageDurationMs * row.durationCount;
      durationSamples += row.durationCount;
    }
  }

  const terminalCount = totals.completed + totals.failed;
  totals.successRatePercent =
    terminalCount === 0
      ? null
      : Math.round((totals.completed / terminalCount) * 1000) / 10;
  totals.averageDurationMs =
    durationSamples === 0 ? null : Math.round(durationTotalMs / durationSamples);

  return {
    days,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    totals,
    daily: [...dailyByDate.values()],
  };
}

export function buildAnalyticsQuery(
  userId: string,
  startDate: Date
): Prisma.Sql {
  return Prisma.sql`
    SELECT
      DATE_TRUNC('day', execution."createdAt") AS "date",
      execution."status"::text AS "status",
      COUNT(*)::int AS "count",
      COUNT(*) FILTER (
        WHERE execution."status" = 'COMPLETED'
          AND execution."startedAt" IS NOT NULL
          AND execution."completedAt" IS NOT NULL
          AND execution."completedAt" >= execution."startedAt"
      )::int AS "durationCount",
      AVG(
        EXTRACT(EPOCH FROM (execution."completedAt" - execution."startedAt")) * 1000
      ) FILTER (
        WHERE execution."status" = 'COMPLETED'
          AND execution."startedAt" IS NOT NULL
          AND execution."completedAt" IS NOT NULL
          AND execution."completedAt" >= execution."startedAt"
      )::float8 AS "averageDurationMs"
    FROM "public"."workflow_executions" AS execution
    INNER JOIN "public"."workflows" AS workflow
      ON workflow."id" = execution."workflowId"
    WHERE workflow."userId" = ${userId}
      AND execution."createdAt" >= ${startDate}
    GROUP BY DATE_TRUNC('day', execution."createdAt"), execution."status"
    ORDER BY "date" ASC
  `;
}

export async function getWorkflowAnalytics(
  userId: string,
  days: number,
  now: Date = new Date()
): Promise<WorkflowAnalytics> {
  const startDate = getAnalyticsStartDate(now, days);
  const rows = await prisma.$queryRaw<AnalyticsAggregateRow[]>(
    buildAnalyticsQuery(userId, startDate)
  );
  return buildWorkflowAnalytics(rows, days, now);
}
