import { GeneratedWorkflow } from "@/types/ai";
import { WorkflowStepType } from "@/types/workflow";
import { Zap, Sparkles, Mail, Clock, Globe, ArrowRight, Check, Save } from "lucide-react";

// =========================================================
// Step type → visual style map
// =========================================================

const STEP_TYPE_CONFIG: Record<
  WorkflowStepType,
  {
    icon: typeof Zap;
    badgeBg: string;
    badgeText: string;
    border: string;
    iconBg: string;
    iconText: string;
  }
> = {
  TRIGGER: {
    icon: Zap,
    badgeBg: "bg-emerald-950/60",
    badgeText: "text-emerald-400",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-950/60",
    iconText: "text-emerald-400",
  },
  AI: {
    icon: Sparkles,
    badgeBg: "bg-purple-950/60",
    badgeText: "text-purple-400",
    border: "border-purple-500/30",
    iconBg: "bg-purple-950/60",
    iconText: "text-purple-400",
  },
  EMAIL: {
    icon: Mail,
    badgeBg: "bg-blue-950/60",
    badgeText: "text-blue-400",
    border: "border-blue-500/30",
    iconBg: "bg-blue-950/60",
    iconText: "text-blue-400",
  },
  DELAY: {
    icon: Clock,
    badgeBg: "bg-amber-950/60",
    badgeText: "text-amber-400",
    border: "border-amber-500/30",
    iconBg: "bg-amber-950/60",
    iconText: "text-amber-400",
  },
  WEBHOOK: {
    icon: Globe,
    badgeBg: "bg-pink-950/60",
    badgeText: "text-pink-400",
    border: "border-pink-500/30",
    iconBg: "bg-pink-950/60",
    iconText: "text-pink-400",
  },
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
    <div className="rounded-3xl border border-white/[0.08] bg-dark-900/90 p-6 sm:p-8 shadow-card backdrop-blur-xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
              AI Generated
            </span>
            <span className="text-xs font-mono text-slate-500">{orderedSteps.length} Steps</span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-white">{workflow.title}</h3>
          {workflow.description && (
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-md">{workflow.description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSave()}
          disabled={isSaving}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-brand-glow transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-brand-glow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 border border-blue-400/20"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              <span>Saving & Opening Builder...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save & Open Builder</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      <div className="mt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Generated Step Pipeline</h4>
        <ol className="flex flex-col gap-3">
          {orderedSteps.map((step, idx) => {
            const config = STEP_TYPE_CONFIG[step.type] || STEP_TYPE_CONFIG.TRIGGER;
            const Icon = config.icon;

            return (
              <li
                key={`${step.order}-${step.name}-${idx}`}
                className="group relative flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-dark-850 p-4 transition-all hover:border-white/[0.16] hover:bg-dark-800"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${config.iconBg} ${config.iconText} ${config.border} shadow-sm`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500">#{step.order}</span>
                    <p className="truncate text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                      {step.name}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeBg} ${config.badgeText} ${config.border}`}
                >
                  {step.type}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}