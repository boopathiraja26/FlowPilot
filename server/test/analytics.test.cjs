const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  buildDashboardExecutionSummary,
  buildDashboardExecutionSummaryQuery,
  buildAnalyticsQuery,
  buildWorkflowAnalytics,
  getAnalyticsStartDate,
} = require("../dist/services/analytics.service.js");
const {
  analyticsQuerySchema,
} = require("../dist/validators/analytics.validation.js");

test("analytics query accepts only supported time ranges", () => {
  assert.equal(analyticsQuerySchema.safeParse({ days: "7" }).success, true);
  assert.equal(analyticsQuerySchema.safeParse({ days: "30" }).success, true);
  assert.equal(analyticsQuerySchema.safeParse({ days: "90" }).success, true);
  assert.equal(analyticsQuerySchema.safeParse({ days: "14" }).success, false);
  assert.equal(analyticsQuerySchema.safeParse({ days: "-1" }).success, false);
});

test("analytics aggregates grouped execution rows into daily totals and terminal success rate", () => {
  const now = new Date("2026-11-13T14:00:00.000Z");
  const rows = [
    {
      date: new Date("2026-11-10T00:00:00.000Z"),
      status: "COMPLETED",
      count: 2,
      durationCount: 2,
      averageDurationMs: 150,
    },
    {
      date: new Date("2026-11-10T00:00:00.000Z"),
      status: "FAILED",
      count: 1,
      durationCount: 0,
      averageDurationMs: null,
    },
    {
      date: new Date("2026-11-10T00:00:00.000Z"),
      status: "QUEUED",
      count: 1,
      durationCount: 0,
      averageDurationMs: null,
    },
    {
      date: new Date("2026-11-12T00:00:00.000Z"),
      status: "COMPLETED",
      count: 1,
      durationCount: 1,
      averageDurationMs: 500,
    },
  ];

  const analytics = buildWorkflowAnalytics(rows, 7, now);
  const busyDay = analytics.daily.find((day) => day.date === "2026-11-10");

  assert.equal(analytics.daily.length, 7);
  assert.deepEqual(busyDay, {
    date: "2026-11-10",
    total: 4,
    queued: 1,
    running: 0,
    completed: 2,
    failed: 1,
  });
  assert.equal(analytics.totals.total, 5);
  assert.equal(analytics.totals.successRatePercent, 75);
  assert.equal(analytics.totals.averageDurationMs, 267);
  assert.equal(analytics.daily.find((day) => day.date === "2026-11-11").total, 0);
});

test("analytics leaves success and duration unset when there are no eligible results", () => {
  const now = new Date("2026-11-13T14:00:00.000Z");
  const analytics = buildWorkflowAnalytics([], 7, now);

  assert.equal(analytics.totals.total, 0);
  assert.equal(analytics.totals.successRatePercent, null);
  assert.equal(analytics.totals.averageDurationMs, null);
  assert.equal(analytics.daily.length, 7);
});

test("analytics range starts at UTC midnight for the selected number of days", () => {
  assert.equal(
    getAnalyticsStartDate(
      new Date("2026-11-13T14:00:00.000Z"),
      7
    ).toISOString(),
    "2026-11-07T00:00:00.000Z"
  );
});

test("analytics SQL scopes execution aggregation to the owner with bound parameters", () => {
  const start = new Date("2026-11-07T00:00:00.000Z");
  const query = buildAnalyticsQuery("user-a", start);

  assert.match(query.sql, /workflow\."userId"\s*=/);
  assert.match(query.sql, /execution\."createdAt"\s*>=/);
  assert.deepEqual(query.values, ["user-a", start]);
  assert.equal(query.sql.includes("user-a"), false);
});

test("dashboard summary aggregates lifetime status counts and terminal success rate", () => {
  const summary = buildDashboardExecutionSummary([
    { status: "QUEUED", count: 2 },
    { status: "RUNNING", count: 1 },
    { status: "COMPLETED", count: 8 },
    { status: "FAILED", count: 2 },
  ]);

  assert.deepEqual(summary, {
    totalExecutions: 13,
    queuedExecutions: 2,
    runningExecutions: 1,
    completedExecutions: 8,
    failedExecutions: 2,
    successRate: 80,
  });
});

test("dashboard summary leaves success rate unset without terminal executions", () => {
  const summary = buildDashboardExecutionSummary([
    { status: "QUEUED", count: 2 },
    { status: "RUNNING", count: 1 },
  ]);

  assert.equal(summary.totalExecutions, 3);
  assert.equal(summary.successRate, null);
});

test("dashboard summary query restricts aggregation to the authenticated owner", () => {
  const query = buildDashboardExecutionSummaryQuery("user-a");

  assert.match(query.sql, /workflow\."userId"\s*=/);
  assert.match(query.sql, /INNER JOIN "public"\."workflows"/);
  assert.match(query.sql, /GROUP BY execution\."status"/);
  assert.deepEqual(query.values, ["user-a"]);
  assert.equal(query.sql.includes("user-a"), false);
});
