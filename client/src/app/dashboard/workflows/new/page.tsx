"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Bot, AlertCircle } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { PromptForm } from "@/components/workflow/PromptForm";
import { WorkflowPreview } from "@/components/workflow/WorkflowPreview";
import { api } from "@/lib/api";
import { GeneratedWorkflow } from "@/types/ai";
import { Workflow } from "@/types/workflow";

export default function NewWorkflowPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState<string>("");
  const [workflow, setWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(submittedPrompt: string) {
    setPrompt(submittedPrompt);
    setIsGenerating(true);
    setError(null);
    setWorkflow(null);

    try {
      const response = await api.post("/ai/generate", { prompt: submittedPrompt });
      setWorkflow(response.data.data.workflow as GeneratedWorkflow);
    } catch (err) {
      setError("Couldn't generate a workflow from that prompt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!prompt) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await api.post("/ai/generate-and-save", { prompt });
      const savedWorkflow = response.data.data.workflow as Workflow;
      router.push(`/dashboard/workflows/${savedWorkflow.id}`);
    } catch (err) {
      setError("Couldn't save this workflow. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">AI Workflow Builder</h2>
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-100">
                Gemini AI
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              Describe your automation scenario in plain text and let AI generate the workflow steps.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <PromptForm onGenerate={handleGenerate} isLoading={isGenerating} />
          </div>

          <div>
            {workflow ? (
              <WorkflowPreview workflow={workflow} onSave={handleSave} isSaving={isSaving} />
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-3 animate-float">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No workflow generated yet</h3>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  Enter your automation prompt on the left to watch Gemini build your pipeline steps in real time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}