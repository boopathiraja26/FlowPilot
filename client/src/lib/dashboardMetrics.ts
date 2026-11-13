import type { Workflow } from "@/types/workflow";
import type { WorkflowExecution } from "@/types/execution";

export interface DashboardMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  draftWorkflows: number;
  archivedWorkflows: number;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  queuedExecutions: number;
  runningExecutions: number;
  successRate: number | null;
}

export interface DashboardExecutionSummary {
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  queuedExecutions: number;
  runningExecutions: number;
  successRate: number | null;
}

function timestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function isDashboardExecutionSummary(
  value: unknown
): value is DashboardExecutionSummary {
  if (!value || typeof value !== "object") return false;
  const summary = value as Record<string, unknown>;
  const countFields = [
    "totalExecutions",
    "completedExecutions",
    "failedExecutions",
    "queuedExecutions",
    "runningExecutions",
  ];

  return (
    countFields.every((field) => {
      const count = summary[field];
      return (
        typeof count === "number" &&
        Number.isSafeInteger(count) &&
        count >= 0
      );
    }) &&
    (summary.successRate === null ||
      (typeof summary.successRate === "number" &&
        Number.isFinite(summary.successRate) &&
        summary.successRate >= 0 &&
        summary.successRate <= 100))
  );
}

export function getDashboardMetrics(
  workflows: Workflow[],
  executionSummary: DashboardExecutionSummary
): DashboardMetrics {
  return {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter((workflow) => workflow.status === "ACTIVE")
      .length,
    draftWorkflows: workflows.filter((workflow) => workflow.status === "DRAFT")
      .length,
    archivedWorkflows: workflows.filter(
      (workflow) => workflow.status === "ARCHIVED"
    ).length,
    ...executionSummary,
  };
}

export function getRecentWorkflows(
  workflows: Workflow[],
  limit: number
): Workflow[] {
  return [...workflows]
    .sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt))
    .slice(0, Math.max(0, limit));
}
