import { GeneratedWorkflow } from "@/types/ai";
import { WorkflowStepType } from "@/types/workflow";

// =========================================================
// Step type → visual style map (mirrors WorkflowStepNode.tsx)
// =========================================================

const STEP_TYPE_STYLES: Record<WorkflowStepType, { badgeBg: string; badgeText: string }> = {
  TRIGGER: { badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  AI: { badgeBg: "bg-purple-100", badgeText: "text-purple-700" },
  EMAIL: { badgeBg: "bg-blue-100", badgeText: "text-blue-700" },
  DELAY: { badgeBg: "bg-orange-100", badgeText: "text-orange-700" },
  WEBHOOK: { badgeBg: "bg-pink-100", badgeText: "text-pink-700" },
};

// =========================================================
// Props
// =========================================================

interface WorkflowPreviewProps {
  workflow: GeneratedWorkflow;
  onSave: () => void | Promise<void>;
  isSaving: boolean;
}

// =========================================================
// WorkflowPreview
// =========================================================

export function WorkflowPreview({ workflow, onSave, isSaving }: WorkflowPreviewProps) {
  const orderedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{workflow.title}</h3>
          {workflow.description && (
            <p className="mt-1 text-sm text-gray-500">{workflow.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSave()}
          disabled={isSaving}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Saving...
            </>
          ) : (
            "Save Workflow"
          )}
        </button>
      </div>

      <ol className="mt-6 flex flex-col gap-3">
        {orderedSteps.map((step) => {
          const style = STEP_TYPE_STYLES[step.type];

          return (
            <li
              key={`${step.order}-${step.name}`}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-500">
                {step.order}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-gray-900">
                {step.name}
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.badgeBg} ${style.badgeText}`}
              >
                {step.type}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}