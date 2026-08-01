import Link from "next/link";

import { Workflow } from "@/types/workflow";

// =========================================================
// Status badge styles
// =========================================================

const STATUS_STYLES: Record<Workflow["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-amber-100 text-amber-700",
};

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
// WorkflowCard
// =========================================================

export function WorkflowCard({ workflow, onDelete }: WorkflowCardProps) {
  const stepCount = workflow.steps?.length ?? 0;

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-gray-900" title={workflow.title}>
          {workflow.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[workflow.status]}`}
        >
          {workflow.status}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500">
        {workflow.description || "No description provided."}
      </p>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span>
          {stepCount} {stepCount === 1 ? "step" : "steps"}
        </span>
        <span className="h-1 w-1 rounded-full bg-gray-300" />
        <span>Created {formatCreatedDate(workflow.createdAt)}</span>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
        <Link
          href={`/dashboard/workflows/${workflow.id}`}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-brand-700"
        >
          Open
        </Link>
        <button
          type="button"
          onClick={() => onDelete(workflow.id)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}