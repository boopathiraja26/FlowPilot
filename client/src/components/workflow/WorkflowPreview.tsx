"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ChevronDown, ChevronUp, Loader2, Save, Trash2 } from "lucide-react";

import { GeneratedWorkflow, GeneratedWorkflowStep } from "@/types/ai";
import { WorkflowStepType } from "@/types/workflow";

interface WorkflowPreviewProps {
  workflow: GeneratedWorkflow;
  onChange: (workflow: GeneratedWorkflow) => void;
  onSave: () => void | Promise<void>;
  isSaving: boolean;
  saveDisabled?: boolean;
}

const STEP_TYPES: WorkflowStepType[] = ["TRIGGER", "AI", "EMAIL", "DELAY", "WEBHOOK"];

function cloneWorkflow(workflow: GeneratedWorkflow): GeneratedWorkflow {
  return JSON.parse(JSON.stringify(workflow)) as GeneratedWorkflow;
}

function normalizeSteps(steps: GeneratedWorkflowStep[]): GeneratedWorkflowStep[] {
  return steps.map((step, index) => ({ ...step, order: index + 1 }));
}

function parseConfig(text: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(text || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "Config must be a JSON object." };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Config must be valid JSON." };
  }
}

export function WorkflowPreview({ workflow, onChange, onSave, isSaving, saveDisabled = false }: WorkflowPreviewProps) {
  const [configTextByIndex, setConfigTextByIndex] = useState<Record<number, string>>({});
  const [configErrorsByIndex, setConfigErrorsByIndex] = useState<Record<number, string | null>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });

  const orderedSteps = useMemo(
    () => normalizeSteps([...workflow.steps].sort((a, b) => a.order - b.order)),
    [workflow.steps]
  );

  function updateWorkflow(next: GeneratedWorkflow) {
    const normalized: GeneratedWorkflow = {
      ...next,
      steps: normalizeSteps(next.steps),
    };
    onChange(normalized);
  }

  function updateTitle(title: string) {
    updateWorkflow({ ...cloneWorkflow(workflow), title });
  }

  function updateDescription(description: string) {
    updateWorkflow({ ...cloneWorkflow(workflow), description: description.trim().length ? description : null });
  }

  function updateStep(index: number, patch: Partial<GeneratedWorkflowStep>) {
    const next = cloneWorkflow({ ...workflow, steps: orderedSteps });
    next.steps[index] = { ...next.steps[index], ...patch };
    updateWorkflow(next);
  }

  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= orderedSteps.length) return;
    const nextSteps = [...orderedSteps];
    const [moved] = nextSteps.splice(index, 1);
    nextSteps.splice(target, 0, moved);
    // remap config editor states/errors by value is complex; reset them to avoid misalignment
    setConfigTextByIndex({});
    setConfigErrorsByIndex({});
    updateWorkflow({ ...cloneWorkflow(workflow), steps: nextSteps });
  }

  function removeStep(index: number) {
    const nextSteps = orderedSteps.filter((_, i) => i !== index);
    setConfigTextByIndex({});
    setConfigErrorsByIndex({});
    updateWorkflow({ ...cloneWorkflow(workflow), steps: nextSteps });
  }

  function getConfigText(index: number, step: GeneratedWorkflowStep): string {
    if (configTextByIndex[index] !== undefined) return configTextByIndex[index];
    return JSON.stringify(step.config ?? {}, null, 2);
  }

  function handleConfigChange(index: number, text: string) {
    setConfigTextByIndex((prev) => ({ ...prev, [index]: text }));
    const parsed = parseConfig(text);
    if (parsed.ok) {
      setConfigErrorsByIndex((prev) => ({ ...prev, [index]: null }));
      updateStep(index, { config: parsed.value });
    } else {
      setConfigErrorsByIndex((prev) => ({ ...prev, [index]: parsed.error }));
    }
  }

  const hasConfigErrors = Object.values(configErrorsByIndex).some(Boolean);
  const hasTitleError = workflow.title.trim().length < 3;
  const hasNoSteps = orderedSteps.length === 0;
  const canSave = !isSaving && !saveDisabled && !hasConfigErrors && !hasTitleError && !hasNoSteps;

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> AI-generated draft
            </span>
            <span className="text-xs font-medium text-slate-500">{orderedSteps.length} step{orderedSteps.length === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Review and edit this draft before saving. Saving creates a real workflow and opens it in the builder for further configuration.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSave()}
          disabled={!canSave}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving draft…</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save and open builder</span>
            </>
          )}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-900">
            Workflow title <span className="text-rose-600">*</span>
          </label>
          <input
            value={workflow.title}
            onChange={(e) => updateTitle(e.target.value)}
            maxLength={100}
            className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring ${hasTitleError ? "border-rose-300" : "border-slate-300"}`}
            placeholder="Workflow title"
          />
          <p className={`mt-1.5 text-xs ${hasTitleError ? "text-rose-600" : "text-slate-500"}`}>
            {hasTitleError ? "Title must be at least 3 characters." : "3–100 characters."}
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-900">Description <span className="font-normal text-slate-500">(optional)</span></label>
          <textarea
            value={workflow.description ?? ""}
            onChange={(e) => updateDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring"
            placeholder="Describe what this workflow does"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-slate-900">Generated steps</h4>
          {hasConfigErrors ? <p className="text-xs font-medium text-rose-600">Fix step config JSON errors before saving.</p> : null}
          {hasNoSteps ? <p className="text-xs font-medium text-rose-600">At least one step is required.</p> : null}
        </div>

        {orderedSteps.map((step, index) => {
          const configText = getConfigText(index, step);
          const configError = configErrorsByIndex[index];
          const isExpanded = expanded[index] ?? false;
          return (
            <div key={`${index}-${step.order}`} className="rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-slate-200 bg-white px-1.5 text-xs font-semibold text-slate-700">{index + 1}</span>
                    <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">{step.type}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <label className="mb-1 block text-xs font-medium text-slate-700">Step name</label>
                      <input
                        value={step.name}
                        onChange={(e) => updateStep(index, { name: e.target.value })}
                        maxLength={100}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-ring"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="mb-1 block text-xs font-medium text-slate-700">Step type</label>
                      <select
                        value={step.type}
                        onChange={(e) => updateStep(index, { type: e.target.value as WorkflowStepType })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-ring"
                      >
                        {STEP_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0} className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-ring" title="Move up">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => moveStep(index, 1)} disabled={index === orderedSteps.length - 1} className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-ring" title="Move down">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setExpanded((prev) => ({ ...prev, [index]: !isExpanded }))} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-ring">
                    Config {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" onClick={() => removeStep(index)} className="inline-flex items-center rounded-md border border-rose-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50 focus-ring" title="Remove step">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="border-t border-slate-200 px-4 pb-4 pt-3">
                  <label className="mb-1 block text-xs font-medium text-slate-700">Step config (JSON object)</label>
                  <textarea
                    value={configText}
                    onChange={(e) => handleConfigChange(index, e.target.value)}
                    rows={6}
                    spellCheck={false}
                    className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-xs text-slate-800 shadow-sm focus-ring ${configError ? "border-rose-300" : "border-slate-300"}`}
                  />
                  {configError ? <p className="mt-1.5 text-xs font-medium text-rose-600">{configError}</p> : <p className="mt-1.5 text-xs text-slate-500">Use a JSON object for step-specific configuration. You can refine details in the builder after saving.</p>}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}