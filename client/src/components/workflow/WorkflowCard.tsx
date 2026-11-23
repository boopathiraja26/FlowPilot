import Link from "next/link";
import { GitFork, Trash2, ArrowUpRight, Layers, Power, PauseCircle, Copy, Activity, Clock3 } from "lucide-react";
import { Workflow } from "@/types/workflow";
import { StatusBadge } from "@/components/ui/StatusBadge";

// =========================================================
// Helpers
// =========================================================

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// =========================================================
// Props
// =========================================================

interface WorkflowCardProps {
  workflow: Workflow;
  onDelete: (workflowId: string) => void;
  onDuplicate?: (workflowId: string) => void | Promise<void>;
  onActivate?: (workflowId: string) => void | Promise<void>;
  onDeactivate?: (workflowId: string) => void | Promise<void>;
  isToggling?: boolean;
  isDuplicating?: boolean;
  isDeleting?: boolean;
}

// =========================================================
// WorkflowCard Component
// =========================================================

export function WorkflowCard({
  workflow,
  onDelete,
  onDuplicate,
  onActivate,
  onDeactivate,
  isToggling = false,
  isDuplicating = false,
  isDeleting = false,
}: WorkflowCardProps) {
  const steps = workflow.steps ?? [];
  const stepCount = steps.length;
  const isActive = workflow.status === "ACTIVE";
  const executionCount = workflow.executionCount ?? 0;
  const lastExecution = workflow.lastExecution ?? null;

  return (
    <div className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-transform duration-150 group-hover:scale-105">
              <GitFork className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-600" title={workflow.title}>
                {workflow.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Updated {formatDate(workflow.updatedAt)}</p>
            </div>
          </div>

          <StatusBadge status={workflow.status} />
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">
          {workflow.description || "No description provided."}
        </p>

        {/* Activity indicators */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Executions</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Activity className="h-3.5 w-3.5 text-slate-400" />
              {executionCount}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Last run</p>
            <div className="mt-0.5">
              {lastExecution ? (
                <div className="flex flex-col gap-1">
                  <StatusBadge status={lastExecution.status} className="w-fit px-2 py-0 text-[10px]" showIcon={lastExecution.status !== "RUNNING"} />
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock3 className="h-3 w-3" />
                    {formatDateTime(lastExecution.startedAt)}
                  </span>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-500">No runs yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Step Sequence Pills */}
        {stepCount > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-1">
            {steps.slice(0, 4).map((s, idx) => (
              <span
                key={s.id || idx}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {s.type}
              </span>
            ))}
            {stepCount > 4 && (
              <span className="text-[10px] font-semibold text-slate-400">+{stepCount - 4} more</span>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            No steps configured yet.
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="mb-3 flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1 text-slate-500">
            <Layers className="h-3 w-3 text-slate-400" />
            {stepCount} {stepCount === 1 ? "step" : "steps"}
          </span>
          <span>Created {formatDate(workflow.createdAt)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isActive ? (
            <button
              type="button"
              onClick={() => onDeactivate?.(workflow.id)}
              disabled={isToggling || isDuplicating || isDeleting || !onDeactivate}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm transition-all duration-150 hover:bg-amber-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              title="Deactivate workflow"
            >
              <PauseCircle className="h-3.5 w-3.5" />
              <span>{isToggling ? "Updating..." : "Deactivate"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onActivate?.(workflow.id)}
              disabled={isToggling || isDuplicating || isDeleting || !onActivate}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition-all duration-150 hover:bg-emerald-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              title="Activate workflow"
            >
              <Power className="h-3.5 w-3.5" />
              <span>{isToggling ? "Updating..." : "Activate"}</span>
            </button>
          )}

          <Link
            href={`/dashboard/workflows/${workflow.id}`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-700 active:scale-[0.98]"
          >
            <span>Open</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => onDuplicate?.(workflow.id)}
            disabled={isToggling || isDuplicating || isDeleting || !onDuplicate}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            title="Duplicate workflow"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(workflow.id)}
            disabled={isToggling || isDuplicating || isDeleting}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-all duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            title="Delete workflow"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}