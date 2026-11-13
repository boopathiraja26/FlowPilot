"use client";

import { useEffect, useState } from "react";
import { WorkflowStepType } from "@/types/workflow";
import { Zap, Sparkles, Mail, Clock, Globe, X, Plus } from "lucide-react";
import { useDialogFocus } from "@/hooks/useDialogFocus";

// =========================================================
// Step type options
// =========================================================

const STEP_TYPE_OPTIONS: {
  value: WorkflowStepType;
  label: string;
  icon: typeof Zap;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}[] = [
  {
    value: "TRIGGER",
    label: "Trigger",
    icon: Zap,
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    activeBorder: "border-emerald-300 ring-2 ring-emerald-500/20",
  },
  {
    value: "AI",
    label: "Gemini AI",
    icon: Sparkles,
    activeBg: "bg-purple-50",
    activeText: "text-purple-700",
    activeBorder: "border-purple-300 ring-2 ring-purple-500/20",
  },
  {
    value: "EMAIL",
    label: "SMTP Email",
    icon: Mail,
    activeBg: "bg-blue-50",
    activeText: "text-blue-700",
    activeBorder: "border-blue-300 ring-2 ring-blue-500/20",
  },
  {
    value: "DELAY",
    label: "Delay Timer",
    icon: Clock,
    activeBg: "bg-amber-50",
    activeText: "text-amber-700",
    activeBorder: "border-amber-300 ring-2 ring-amber-500/20",
  },
  {
    value: "WEBHOOK",
    label: "Webhook",
    icon: Globe,
    activeBg: "bg-pink-50",
    activeText: "text-pink-700",
    activeBorder: "border-pink-300 ring-2 ring-pink-500/20",
  },
];

// =========================================================
// Values
// =========================================================

export interface NewStepValues {
  type: WorkflowStepType;
  name: string;
}

// =========================================================
// Props
// =========================================================

interface AddStepDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onCreate: (values: NewStepValues) => void;
}

// =========================================================
// Component
// =========================================================

export function AddStepDialog({
  isOpen,
  onCancel,
  onCreate,
}: AddStepDialogProps) {
  const [type, setType] = useState<WorkflowStepType>("TRIGGER");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onCancel);

  // Reset whenever dialog opens
  useEffect(() => {
    if (isOpen) {
      setType("TRIGGER");
      setName("");
      setNameError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleCreate() {
    if (!name.trim()) {
      setNameError("Step name is required.");
      return;
    }

    onCreate({
      type,
      name: name.trim(),
    });
  }

  function handleCancel() {
    onCancel();
  }

  return (
    <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-step-dialog-title"
        aria-describedby="add-step-dialog-description"
        tabIndex={-1}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl animate-scale-in"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="add-step-dialog-title" className="text-base font-extrabold text-slate-900">
              Add Workflow Step
            </h2>

            <p id="add-step-dialog-description" className="mt-1 text-xs text-slate-500">
              Select a step type and give your new pipeline node a name.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close add workflow step dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Step Type */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Step Type
            </p>

            <div role="group" aria-label="Step type" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STEP_TYPE_OPTIONS.map((option) => {
                const active = type === option.value;
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                      active
                        ? `${option.activeBg} ${option.activeText} ${option.activeBorder}`
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900"
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="step-name"
              className="text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Step Name
            </label>

            <input
              id="step-name"
              type="text"
              value={name}
              placeholder="e.g. Send Welcome Email"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "step-name-error" : undefined}
              onChange={(e) => {
                setName(e.target.value);

                if (nameError) {
                  setNameError(null);
                }
              }}
              className={`rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${
                nameError
                  ? "border-rose-300 ring-4 ring-rose-500/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            />

            {nameError && (
              <p id="step-name-error" role="alert" className="text-xs text-rose-600 font-medium">
                • {nameError}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Step</span>
          </button>
        </div>
      </div>
    </div>
  );
}