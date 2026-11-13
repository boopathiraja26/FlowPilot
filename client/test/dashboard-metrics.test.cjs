const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../src/lib/dashboardMetrics.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const dashboardMetricsModule = new Module(sourcePath);
dashboardMetricsModule.filename = sourcePath;
dashboardMetricsModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
dashboardMetricsModule._compile(compiled, sourcePath);

const {
  getDashboardMetrics,
  isDashboardExecutionSummary,
  getRecentWorkflows,
} = dashboardMetricsModule.exports;

test("dashboard metrics combine workflow states with all-time server aggregates", () => {
  const metrics = getDashboardMetrics(
    [
      { status: "ACTIVE" },
      { status: "DRAFT" },
      { status: "ARCHIVED" },
      { status: "ACTIVE" },
    ],
    {
      totalExecutions: 5,
      completedExecutions: 2,
      failedExecutions: 1,
      queuedExecutions: 1,
      runningExecutions: 1,
      successRate: 66.7,
    }
  );

  assert.deepEqual(metrics, {
    totalWorkflows: 4,
    activeWorkflows: 2,
    draftWorkflows: 1,
    archivedWorkflows: 1,
    totalExecutions: 5,
    completedExecutions: 2,
    failedExecutions: 1,
    queuedExecutions: 1,
    runningExecutions: 1,
    successRate: 66.7,
  });
});

test("dashboard metrics leave success rate unset without completed or failed runs", () => {
  const metrics = getDashboardMetrics([], {
    totalExecutions: 1,
    completedExecutions: 0,
    failedExecutions: 0,
    queuedExecutions: 0,
    runningExecutions: 1,
    successRate: null,
  });
  assert.equal(metrics.successRate, null);
});

test("dashboard summary response validation accepts nonnegative counts and truthful rates", () => {
  assert.equal(
    isDashboardExecutionSummary({
      totalExecutions: 1,
      completedExecutions: 1,
      failedExecutions: 0,
      queuedExecutions: 0,
      runningExecutions: 0,
      successRate: 100,
    }),
    true
  );
  assert.equal(
    isDashboardExecutionSummary({
      totalExecutions: -1,
      completedExecutions: 0,
      failedExecutions: 0,
      queuedExecutions: 0,
      runningExecutions: 0,
      successRate: 100,
    }),
    false
  );
});

test("recent workflows sort newest-first without mutating API results", () => {
  const workflows = [
    { id: "older", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "newer", createdAt: "2026-02-01T00:00:00.000Z" },
  ];

  assert.deepEqual(getRecentWorkflows(workflows, 1).map(({ id }) => id), ["newer"]);
  assert.deepEqual(workflows.map(({ id }) => id), ["older", "newer"]);
});
