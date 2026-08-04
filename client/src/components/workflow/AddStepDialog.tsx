"use client";

import { useEffect, useState } from "react";

import { WorkflowStepType } from "@/types/workflow";

// =========================================================
// Step type options
// =========================================================

const STEP_TYPE_OPTIONS: {
  value: WorkflowStepType;
  label: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}[] = [
  {
    value: "TRIGGER",
    label: "Trigger",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    activeBorder: "border-emerald-400",
  },
  {
    value: "AI",
    label: "AI",
    activeBg: "bg-purple-50",
    activeText: "text-purple-700",
    activeBorder: "border-purple-400",
  },
  {
    value: "EMAIL",
    label: "Email",
    activeBg: "bg-blue-50",
    activeText: "text-blue-700",
    activeBorder: "border-blue-400",
  },
  {
    value: "DELAY",
    label: "Delay",
    activeBg: "bg-orange-50",
    activeText: "text-orange-700",
    activeBorder: "border-orange-400",
  },
  {
    value: "WEBHOOK",
    label: "Webhook",
    activeBg: "bg-pink-50",
    activeText: "text-pink-700",
    activeBorder: "border-pink-400",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            Add Step
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose a step type and give it a name.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Step Type */}

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              Type
            </p>

            <div className="grid grid-cols-3 gap-2">
              {STEP_TYPE_OPTIONS.map((option) => {
                const active = type === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                      active
                        ? `${option.activeBg} ${option.activeText} ${option.activeBorder}`
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Name */}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="step-name"
              className="text-sm font-medium text-gray-700"
            >
              Step Name
            </label>

            <input
              id="step-name"
              type="text"
              value={name}
              placeholder="e.g. Send Welcome Email"
              onChange={(e) => {
                setName(e.target.value);

                if (nameError) {
                  setNameError(null);
                }
              }}
              className={`rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${
                nameError
                  ? "border-red-400"
                  : "border-gray-300"
              }`}
            />

            {nameError && (
              <p className="text-xs text-red-500">
                {nameError}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Create Step
          </button>
        </div>
      </div>
    </div>
  );
}