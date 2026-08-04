"use client";

import { useEffect, useState } from "react";
import { WorkflowStep, WorkflowStepType } from "@/types/workflow";

// =========================================================
// Values handed back to the parent on save
// =========================================================

export interface StepEditorValues {
  name: string;
  type: WorkflowStepType;
  description: string;
  config: Record<string, unknown>;
}

// =========================================================
// Props
// =========================================================

interface StepEditorProps {
  step: WorkflowStep;
  onSave: (values: StepEditorValues) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  isSaving: boolean;
}

const STEP_TYPE_OPTIONS: WorkflowStepType[] = [
  "TRIGGER",
  "AI",
  "EMAIL",
  "DELAY",
  "WEBHOOK",
];

// =========================================================
// StepEditor
// =========================================================

export function StepEditor({
  step,
  onSave,
  onDelete,
  isSaving,
}: StepEditorProps) {
  const [name, setName] = useState(step.name);
  const [type, setType] = useState<WorkflowStepType>(step.type);
  const [description, setDescription] = useState(
    typeof step.config?.description === "string"
      ? step.config.description
      : ""
  );

  const [configText, setConfigText] = useState(
    JSON.stringify(step.config ?? {}, null, 2)
  );

  const [configError, setConfigError] = useState<string | null>(null);

  // =========================================================
  // Update editor whenever a different step is selected
  // =========================================================

  useEffect(() => {
    setName(step.name);

    setType(step.type);

    setDescription(
      typeof step.config?.description === "string"
        ? step.config.description
        : ""
    );

    setConfigText(
      JSON.stringify(step.config ?? {}, null, 2)
    );

    setConfigError(null);
  }, [step]);

  // =========================================================
  // Config validation
  // =========================================================

  function handleConfigChange(value: string) {
    setConfigText(value);

    try {
      JSON.parse(value);
      setConfigError(null);
    } catch {
      setConfigError("Config must be valid JSON.");
    }
  }

  // =========================================================
  // Save
  // =========================================================

  function handleSave() {
    let parsedConfig: Record<string, unknown>;

    try {
      parsedConfig = JSON.parse(configText);
    } catch {
      setConfigError("Config must be valid JSON.");
      return;
    }

    if (!name.trim()) return;

    // Store description inside config
    parsedConfig.description = description.trim();

    onSave({
      name: name.trim(),
      type,
      description: description.trim(),
      config: parsedConfig,
    });
  }

  const isSaveDisabled =
    isSaving || Boolean(configError) || !name.trim();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Edit Step
        </h3>

        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
          Step {step.stepOrder}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Name */}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="step-name"
            className="text-sm font-medium text-gray-700"
          >
            Name
          </label>

          <input
            id="step-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            placeholder="Send Welcome Email"
            className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Type */}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="step-type"
            className="text-sm font-medium text-gray-700"
          >
            Type
          </label>

          <select
            id="step-type"
            value={type}
            disabled={isSaving}
            onChange={(e) =>
              setType(e.target.value as WorkflowStepType)
            }
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            {STEP_TYPE_OPTIONS.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="step-description"
            className="text-sm font-medium text-gray-700"
          >
            Description
          </label>

          <textarea
            id="step-description"
            value={description}
            rows={3}
            disabled={isSaving}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this step..."
            className="resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Config */}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="step-config"
            className="text-sm font-medium text-gray-700"
          >
            Config (JSON)
          </label>

          <textarea
            id="step-config"
            rows={8}
            spellCheck={false}
            value={configText}
            disabled={isSaving}
            onChange={(e) =>
              handleConfigChange(e.target.value)
            }
            className={`resize-none rounded-lg border px-3.5 py-2.5 font-mono text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${
              configError
                ? "border-red-400"
                : "border-gray-300"
            }`}
          />

          {configError && (
            <p className="text-xs text-red-500">
              {configError}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}

      <div className="mt-6 flex gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          disabled={isSaveDisabled}
          onClick={handleSave}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:bg-brand-300"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => onDelete()}
          className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}