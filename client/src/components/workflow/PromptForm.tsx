"use client";

import { FormEvent, useState } from "react";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";

// =========================================================
// Constraints (mirrors server/src/validators/ai.validation.ts)
// =========================================================

const MIN_PROMPT_LENGTH = 5;
const MAX_PROMPT_LENGTH = 1000;

const PROMPT_TEMPLATES = [
  {
    label: "Employee Onboarding",
    text: "Create an employee onboarding workflow that triggers on employee added, generates a personalized welcome message with Gemini AI, sends a welcome email via SMTP, waits 1 day, then syncs the HR portal via webhook.",
  },
  {
    label: "Lead Enrichment & Alert",
    text: "Create a lead qualification workflow that receives a signup webhook, analyzes company size with Gemini AI, sends an urgent notification to the sales inbox, and posts to the CRM endpoint.",
  },
  {
    label: "Customer Support Router",
    text: "Build a customer feedback workflow that takes new ticket payloads, categorizes urgency with AI, dispatches an immediate acknowledgment email, and triggers an escalation webhook.",
  },
];

// =========================================================
// Props
// =========================================================

interface PromptFormProps {
  onGenerate: (prompt: string) => void | Promise<void>;
  isLoading: boolean;
}

// =========================================================
// PromptForm
// =========================================================

export function PromptForm({ onGenerate, isLoading }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const charCount = prompt.length;
  const isOverLimit = charCount > MAX_PROMPT_LENGTH;

  function validate(value: string): string | null {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return "Describe the workflow you want to build.";
    }
    if (trimmed.length < MIN_PROMPT_LENGTH) {
      return `Prompt must be at least ${MIN_PROMPT_LENGTH} characters long.`;
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

    if (error) {
      return;
    }

    await onGenerate(prompt.trim());
  }

  function handleSelectTemplate(text: string) {
    setPrompt(text);
    setValidationError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/[0.08] bg-dark-900/90 p-6 sm:p-8 shadow-card backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <label htmlFor="prompt" className="text-sm font-bold text-white">
          Describe your automation scenario
        </label>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Describe what starts the workflow and the chained actions in natural language. Gemini AI will generate the nodes and configuration.
      </p>

      {/* Preset template pills */}
      <div className="mt-4 mb-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
          <span>Quick Inspiration Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => handleSelectTemplate(tpl.text)}
              className="rounded-xl border border-white/[0.08] bg-dark-850 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:border-purple-500/40 hover:bg-purple-950/30 hover:text-purple-300 transition-all active:scale-[0.98]"
            >
              + {tpl.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        id="prompt"
        value={prompt}
        onChange={(event) => {
          setPrompt(event.target.value);
          if (validationError) {
            setValidationError(null);
          }
        }}
        disabled={isLoading}
        rows={6}
        placeholder="e.g. Create an employee onboarding workflow that triggers when a new teammate is added, generates a welcome message with Gemini AI, sends an SMTP welcome email, waits 1 day, then notifies the team portal via webhook."
        className={`mt-2 w-full resize-none rounded-2xl border px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 bg-dark-950/90 outline-none transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 disabled:cursor-not-allowed disabled:opacity-60 ${
          validationError ? "border-rose-500/50 ring-4 ring-rose-500/10" : "border-white/[0.08] hover:border-white/[0.15]"
        }`}
      />

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-rose-400 font-medium">{validationError}</p>
        <p className={`text-xs font-mono ${isOverLimit ? "text-rose-400" : "text-slate-500"}`}>
          {charCount} / {MAX_PROMPT_LENGTH}
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_25px_-4px_rgba(168,85,247,0.35)] transition-all duration-150 hover:from-purple-500 hover:to-blue-500 hover:shadow-[0_0_35px_-4px_rgba(168,85,247,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 border border-purple-400/20"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            <span>Generating Workflow with Gemini AI...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Generate Pipeline Steps</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}