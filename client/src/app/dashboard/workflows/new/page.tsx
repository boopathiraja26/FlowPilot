"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bot,
  Clock,
  Globe,
  Layers,
  Loader2,
  Mail,
  PenSquare,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { PromptForm } from "@/components/workflow/PromptForm";
import { WorkflowPreview } from "@/components/workflow/WorkflowPreview";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/PageState";
import { api } from "@/lib/api";
import { GeneratedWorkflow } from "@/types/ai";
import { Workflow } from "@/types/workflow";

const BUILDING_BLOCKS = [
  { type: "TRIGGER", name: "Trigger", desc: "Manual or webhook entry point that starts execution.", icon: Zap },
  { type: "AI", name: "Gemini AI", desc: "Generate summaries, messages, and structured content.", icon: Sparkles },
  { type: "EMAIL", name: "Email", desc: "Send transactional or workflow emails via SMTP.", icon: Mail },
  { type: "DELAY", name: "Delay", desc: "Pause execution for a configured duration.", icon: Clock },
  { type: "WEBHOOK", name: "Webhook action", desc: "Send HTTP requests to external systems.", icon: Globe },
] as const;

function getApiErrorMessage(err: unknown, fallback: string): string {
  const responseMessage =
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
      ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
      : null;
  if (responseMessage && responseMessage.trim()) return responseMessage;

  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: string }).code;
    if (code === "ECONNABORTED") {
      return "AI workflow generation timed out before it could complete. Please try again, or create the workflow manually.";
    }
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export default function NewWorkflowPage() {
  const router = useRouter();

  // AI generation path
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingGenerated, setIsSavingGenerated] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>("");

  // Manual creation path
  const [manualTitle, setManualTitle] = useState<string>("");
  const [manualDescription, setManualDescription] = useState<string>("");
  const [isCreatingManual, setIsCreatingManual] = useState<boolean>(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const aiConfiguredHint = useMemo(
    () => "AI generation uses your server's configured Gemini integration. If generation is unavailable, manual workflow creation remains fully supported.",
    []
  );

  async function handleGenerate(submittedPrompt: string) {
    setLastPrompt(submittedPrompt);
    setIsGenerating(true);
    setAiError(null);
    setGeneratedWorkflow(null);

    try {
      const response = await api.post(
        "/ai/generate",
        { prompt: submittedPrompt },
        { timeout: 35_000 }
      );
      const workflow = response.data?.data?.workflow as GeneratedWorkflow | undefined;
      if (!workflow || !Array.isArray(workflow.steps)) {
        throw new Error("The AI response did not include a valid workflow draft.");
      }
      setGeneratedWorkflow(workflow);
    } catch (err) {
      setAiError(
        getApiErrorMessage(
          err,
          "Couldn't generate a workflow from that prompt. You can adjust the prompt and try again, or create a workflow manually."
        )
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveGenerated() {
    if (!generatedWorkflow) return;

    const title = generatedWorkflow.title?.trim() ?? "";
    if (title.length < 3) {
      setAiError("Workflow title must be at least 3 characters before saving.");
      return;
    }
    if (!generatedWorkflow.steps || generatedWorkflow.steps.length === 0) {
      setAiError("Add at least one step before saving the generated workflow.");
      return;
    }

    setIsSavingGenerated(true);
    setAiError(null);

    try {
      const response = await api.post(
        "/ai/generate-and-save",
        { workflow: generatedWorkflow },
        { timeout: 35_000 }
      );
      const savedWorkflow = response.data?.data?.workflow as Workflow | undefined;
      if (!savedWorkflow?.id) {
        throw new Error("Workflow was saved but the response was incomplete.");
      }
      router.push(`/dashboard/workflows/${savedWorkflow.id}`);
    } catch (err) {
      setAiError(getApiErrorMessage(err, "Couldn't save this workflow draft. Please review the steps and try again."));
      setIsSavingGenerated(false);
    }
  }

  async function handleManualCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualError(null);

    const title = manualTitle.trim();
    const description = manualDescription.trim();

    if (title.length < 3) {
      setManualError("Workflow name must be at least 3 characters long.");
      return;
    }
    if (title.length > 100) {
      setManualError("Workflow name must not exceed 100 characters.");
      return;
    }

    setIsCreatingManual(true);
    try {
      const response = await api.post("/workflows", {
        title,
        description: description.length > 0 ? description : null,
        status: "DRAFT",
      });
      const createdWorkflow = response.data?.data?.workflow as Workflow | undefined;
      if (!createdWorkflow?.id) {
        throw new Error("Workflow was created but the response was incomplete.");
      }
      router.push(`/dashboard/workflows/${createdWorkflow.id}`);
    } catch (err) {
      setManualError(getApiErrorMessage(err, "Couldn't create the workflow. Please try again."));
      setIsCreatingManual(false);
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-8 pb-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-500">Automation</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create workflow</h1>
                <p className="mt-0.5 text-sm text-slate-600">
                  Start from a blank draft or generate an editable workflow with AI.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          {/* Manual creation */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <PenSquare className="h-4 w-4 text-slate-700" />
                  <h2 className="text-base font-semibold text-slate-900">Create manually</h2>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  Create a draft workflow and design steps in the visual builder. This path works independently of AI
                  generation.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                Reliable fallback
              </span>
            </div>

            {manualError ? (
              <div className="mt-4">
                <InlineError title="Couldn't create workflow" message={manualError} />
              </div>
            ) : null}

            <form onSubmit={handleManualCreate} className="mt-5 space-y-4">
              <div>
                <label htmlFor="manual-title" className="mb-1.5 block text-sm font-medium text-slate-900">
                  Workflow name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="manual-title"
                  type="text"
                  value={manualTitle}
                  onChange={(e) => {
                    setManualTitle(e.target.value);
                    if (manualError) setManualError(null);
                  }}
                  disabled={isCreatingManual}
                  maxLength={100}
                  placeholder="e.g. Employee onboarding"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring disabled:cursor-not-allowed disabled:bg-slate-50"
                />
                <p className="mt-1.5 text-xs text-slate-500">3–100 characters. You can edit details later in the builder.</p>
              </div>

              <div>
                <label htmlFor="manual-description" className="mb-1.5 block text-sm font-medium text-slate-900">
                  Description <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="manual-description"
                  value={manualDescription}
                  onChange={(e) => {
                    setManualDescription(e.target.value);
                    if (manualError) setManualError(null);
                  }}
                  disabled={isCreatingManual}
                  maxLength={500}
                  rows={4}
                  placeholder="Briefly describe what this workflow will automate."
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring disabled:cursor-not-allowed disabled:bg-slate-50"
                />
                <p className="mt-1.5 text-xs text-slate-500">Up to 500 characters.</p>
              </div>

              <button
                type="submit"
                disabled={isCreatingManual}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
              >
                {isCreatingManual ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating draft…</span>
                  </>
                ) : (
                  <>
                    <PenSquare className="h-4 w-4" />
                    <span>Create draft workflow</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* AI generation */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-slate-700" />
                  <h2 className="text-base font-semibold text-slate-900">Generate with AI</h2>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  Generate a draft from a prompt, review and edit the result, then save it as a real workflow.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                AI-assisted
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <p>{aiConfiguredHint}</p>
              </div>
            </div>

            {aiError ? (
              <div className="mt-4 space-y-2">
                <InlineError title="AI generation or save failed" message={aiError} />
                {lastPrompt ? (
                  <p className="text-xs text-slate-500">You can adjust the prompt and generate again, or use manual creation.</p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5">
              <PromptForm onGenerate={handleGenerate} isLoading={isGenerating} disabled={isSavingGenerated} />
            </div>
          </section>
        </div>

        {/* AI preview / result */}
        <section className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Generated workflow preview</h2>
              <p className="text-sm text-slate-600">Review and edit the AI-generated draft before saving it to your workspace.</p>
            </div>
            {generatedWorkflow ? (
              <span className="text-xs font-medium text-slate-500">Edits made here are saved to the created workflow draft.</span>
            ) : null}
          </div>

          {generatedWorkflow ? (
            <div className="max-w-5xl">
              <WorkflowPreview
                workflow={generatedWorkflow}
                onChange={setGeneratedWorkflow}
                onSave={handleSaveGenerated}
                isSaving={isSavingGenerated}
              />
            </div>
          ) : (
            <EmptyState
              icon={Bot}
              title={isGenerating ? "Generating workflow draft…" : "No AI draft yet"}
              description={
                isGenerating
                  ? "FlowPilot is generating a workflow draft from your prompt. This may take a moment."
                  : "Describe an automation above to generate an editable draft, or create a workflow manually and build it step by step."
              }
            />
          )}
        </section>

        {/* Building blocks */}
        <section className="border-t border-slate-200 pt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow building blocks</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Supported step types</h2>
            <p className="mt-1 text-sm text-slate-600">Generated and manual workflows use the same real execution building blocks.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {BUILDING_BLOCKS.map((node) => {
              const Icon = node.icon;
              return (
                <div key={node.type} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{node.name}</h3>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{node.type}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{node.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
