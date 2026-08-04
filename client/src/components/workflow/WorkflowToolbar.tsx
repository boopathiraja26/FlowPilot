"use client";

import { Plus, Maximize, LayoutGrid } from "lucide-react";

// =========================================================
// Props
// =========================================================

interface WorkflowToolbarProps {
  onAddStep: () => void;
  onFitView: () => void;
  onAutoLayout: () => void;
  disabled?: boolean;
}

// =========================================================
// WorkflowToolbar
// =========================================================

export function WorkflowToolbar({
  onAddStep,
  onFitView,
  onAutoLayout,
  disabled = false,
}: WorkflowToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={onAddStep}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
      >
        <Plus size={16} />
        Add Step
      </button>

      <button
        type="button"
        onClick={onFitView}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed"
      >
        <Maximize size={16} />
        Fit View
      </button>

      <button
        type="button"
        onClick={onAutoLayout}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed"
      >
        <LayoutGrid size={16} />
        Auto Layout
      </button>
    </div>
  );
}