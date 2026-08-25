"use client";

import { Plus, Maximize, LayoutGrid, Sparkles } from "lucide-react";

interface WorkflowToolbarProps {
  onAddStep: () => void;
  onFitView: () => void;
  onAutoLayout: () => void;
  disabled?: boolean;
}

export function WorkflowToolbar({
  onAddStep,
  onFitView,
  onAutoLayout,
  disabled = false,
}: WorkflowToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-subtle backdrop-blur-md">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAddStep}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-brand-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          <Plus className="h-4 w-4" />
          <span>Add Node Step</span>
        </button>

        <button
          type="button"
          onClick={onFitView}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:cursor-not-allowed"
        >
          <Maximize className="h-3.5 w-3.5 text-slate-500" />
          <span>Fit View</span>
        </button>

        <button
          type="button"
          onClick={onAutoLayout}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:cursor-not-allowed"
        >
          <LayoutGrid className="h-3.5 w-3.5 text-slate-500" />
          <span>Auto Layout</span>
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
        <span>Drag nodes to reorder sequence</span>
      </div>
    </div>
  );
}