"use client";

import { FormEvent, useState } from "react";

// =========================================================
// Constraints (mirrors server/src/validators/ai.validation.ts)
// =========================================================

const MIN_PROMPT_LENGTH = 5;
const MAX_PROMPT_LENGTH = 1000;

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

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-6"
    >
      <label htmlFor="prompt" className="text-sm font-medium text-gray-700">
        Describe your workflow
      </label>
      <p className="mt-1 text-sm text-gray-500">
        Tell FlowPilot what you want to automate, in plain language.
      </p>

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
        placeholder="e.g. Create an employee onboarding workflow that sends a welcome email, waits one day, then assigns setup tasks."
        className={`mt-3 w-full resize-none rounded-lg border px-3.5 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-gray-50 ${
          validationError ? "border-red-400" : "border-gray-300"
        }`}
      />

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-red-500">{validationError}</p>
        <p className={`text-xs ${isOverLimit ? "text-red-500" : "text-gray-400"}`}>
          {charCount} / {MAX_PROMPT_LENGTH}
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Generating workflow...
          </>
        ) : (
          "Generate Workflow"
        )}
      </button>
    </form>
  );
}