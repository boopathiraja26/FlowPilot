"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { PromptForm } from "@/components/workflow/PromptForm";
import { WorkflowPreview } from "@/components/workflow/WorkflowPreview";
import { api } from "@/lib/api";
import { GeneratedWorkflow } from "@/types/ai";
import { Workflow } from "@/types/workflow";

export default function NewWorkflowPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState<string | null>(null);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleGenerate(submittedPrompt: string) {
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedWorkflow(null);

    try {
      const response = await api.post("/ai/generate", { prompt: submittedPrompt });
      setGeneratedWorkflow(response.data.data.workflow as GeneratedWorkflow);
      setPrompt(submittedPrompt);
    } catch (err) {
      setGenerateError(
        "Couldn't generate a workflow from that prompt. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!prompt) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await api.post("/ai/generate-and-save", { prompt });
      const savedWorkflow = response.data.data.workflow as Workflow;
      router.push(`/dashboard/workflows/${savedWorkflow.id}`);
    } catch (err) {
      setSaveError("Couldn't save this workflow. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">New Workflow</h2>
        <p className="text-sm text-gray-500">
          Describe what you want to automate and let FlowPilot build it for you.
        </p>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <PromptForm onGenerate={handleGenerate} isLoading={isGenerating} />

        {generateError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{generateError}</p>
          </div>
        )}

        {generatedWorkflow && (
          <WorkflowPreview
            workflow={generatedWorkflow}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}

        {saveError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{saveError}</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}