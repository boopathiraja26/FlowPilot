"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Lightbulb, Loader2, Sparkles } from "lucide-react";

// =========================================================
// Constraints (mirrors server/src/validators/ai.validation.ts)
// =========================================================

const MIN_PROMPT_LENGTH = 5;
const MAX_PROMPT_LENGTH = 1000;

const PROMPT_TEMPLATES = [
  {
    label: "Employee onboarding",
    text: "Create an employee onboarding workflow that triggers when a new employee is added, generates a personalized welcome message with Gemini AI, sends a welcome email, waits 1 day, then notifies an HR system via webhook.",
  },
  {
    label: "Lead qualification",
    text: "Create a lead qualification workflow that receives a webhook trigger, analyzes the lead details with AI, sends a follow-up email, and posts the result to a CRM webhook.",
  },
  {
    label: "Support triage",
    text: "Build a support triage workflow that triggers on a new ticket event, classifies urgency with AI, sends an acknowledgment email, waits 30 minutes, and escalates high-priority cases via webhook.",
  },
];

interface PromptFormProps {
  onGenerate: (prompt: string) => void | Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export function PromptForm({ onGenerate, isLoading, disabled = false }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const charCount = prompt.length;
  const isOverLimit = charCount > MAX_PROMPT_LENGTH;
  const trimmedLength = prompt.trim().length;

  function validate(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Describe the workflow you want to generate.";
    }
    if (trimmed.length < MIN_PROMPT_LENGTH) {
      return `Prompt must be at least ${MIN_PROMPT_LENGTH} characters.`;
    }
    if (trimmed.length > MAX_PROMPT_LENGTH) {
      return `Prompt must not exceed ${MAX_PROMPT_LENGTH} characters.`;
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validate(prompt);
    setValidationError(error);
    if (error) return;
    await onGenerate(prompt.trim());
  }

  function handleSelectTemplate(text: string) {
    setPrompt(text);
    setValidationError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="ai-workflow-prompt" className="block text-sm font-medium text-slate-900">
          Describe your automation
        </label>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Explain what should trigger the workflow and what should happen next. FlowPilot will generate an editable draft
          using real Gemini output when AI generation is available.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span>Prompt ideas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => handleSelectTemplate(tpl.text)}
              disabled={isLoading || disabled}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          id="ai-workflow-prompt"
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={isLoading || disabled}
          rows={7}
          maxLength={MAX_PROMPT_LENGTH + 200}
          placeholder="Example: When a new employee is added, generate a welcome message with AI, send it by email, wait one day, then notify the HR portal via webhook."
          className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus-ring disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
            validationError || isOverLimit ? "border-rose-300" : "border-slate-300 hover:border-slate-400"
          }`}
        />
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-xs font-medium ${validationError ? "text-rose-600" : "text-slate-500"}`}>
            {validationError ?? `Minimum ${MIN_PROMPT_LENGTH} characters. Generated workflows open in the builder after save.`}
          </p>
          <p className={`text-xs tabular-nums ${isOverLimit ? "text-rose-600 font-medium" : "text-slate-500"}`}>
            {charCount} / {MAX_PROMPT_LENGTH}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || disabled || trimmedLength === 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-ring sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating draft…</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Generate workflow</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}