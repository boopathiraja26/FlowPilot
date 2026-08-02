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
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">AI Workflow Builder</h2>
        <p className="text-sm text-gray-500">
          Describe what you want to automate and let FlowPilot build it for you.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
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
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">No workflow generated yet</p>
                <p className="mt-1 text-sm text-gray-400">
                  Your generated workflow will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}