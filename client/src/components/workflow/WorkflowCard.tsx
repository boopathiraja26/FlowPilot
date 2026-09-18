import Link from "next/link";
import { GitFork, Trash2, ArrowUpRight, Layers } from "lucide-react";
import { Workflow } from "@/types/workflow";
import { StatusBadge } from "@/components/ui/StatusBadge";

// =========================================================
// Helpers
// =========================================================

function formatCreatedDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// =========================================================
// Props
// =========================================================

interface WorkflowCardProps {
  workflow: Workflow;
  onDelete: (workflowId: string) => void;
}

// =========================================================
// WorkflowCard Component
// =========================================================

export function WorkflowCard({ workflow, onDelete }: WorkflowCardProps) {
  const steps = workflow.steps ?? [];
  const stepCount = steps.length;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform duration-150">
              <GitFork className="h-4.5 w-4.5" />
            </div>

            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors" title={workflow.title}>
              {workflow.title}
            </h3>
          </div>

          <StatusBadge status={workflow.status} />
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs text-slate-500 leading-relaxed">
          {workflow.description || "No description provided."}
        </p>

        {/* Step Sequence Pills */}
        {stepCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-1">
            {steps.slice(0, 4).map((s, idx) => (
              <span
                key={s.id || idx}
                className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {s.type}
              </span>
            ))}
            {stepCount > 4 && (
              <span className="text-[10px] font-semibold text-slate-400">
                +{stepCount - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 font-medium">
          <span className="flex items-center gap-1 text-slate-500">
            <Layers className="h-3 w-3 text-slate-400" />
            {stepCount} {stepCount === 1 ? "step" : "steps"}
          </span>
          <span>Created {formatCreatedDate(workflow.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/workflows/${workflow.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-700 active:scale-[0.98]"
          >
            <span>Open Builder</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => onDelete(workflow.id)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-all duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98]"
            title="Delete Workflow"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}