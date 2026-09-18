"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Bot, AlertCircle, Zap, Layers, ArrowRight, CheckCircle2, ShieldCheck, Clock, Mail, Globe, Cpu } from "lucide-react";

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
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-950/60 text-purple-400 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">AI Workflow Creator</h1>
                <span className="rounded-full bg-purple-950/60 px-2.5 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/30 shadow-[0_0_12px_-2px_rgba(168,85,247,0.3)]">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Describe your desired automation pipeline in plain language. AI will synthesize all nodes and configurations.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/60 p-4 text-xs font-semibold text-rose-300 animate-fade-in shadow-card">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {/* Section 1: AI Prompt & Generator */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Step 1 &bull; Natural Language Prompt</span>
            </div>
            <PromptForm onGenerate={handleGenerate} isLoading={isGenerating} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Step 2 &bull; Synthesis Preview</span>
            </div>
            {workflow ? (
              <WorkflowPreview workflow={workflow} onSave={handleSave} isSaving={isSaving} />
            ) : (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.12] bg-dark-900/60 p-8 text-center backdrop-blur-xl">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-950/60 text-purple-400 mb-4 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.25)] animate-float">
                  <Bot className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">Waiting for prompt submission</h3>
                <p className="mt-1.5 max-w-xs text-xs text-slate-400 leading-relaxed">
                  Type your automation instructions on the left or select a preset to generate real workflow steps.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Supported Node Building Blocks Reference */}
        <div className="border-t border-white/[0.08] pt-8">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Supported Node Building Blocks</span>
            <h2 className="mt-1 text-lg font-bold text-white">How FlowPilot Constructs Your Pipelines</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { type: "TRIGGER", name: "Trigger", desc: "Webhook or payload event entry point", icon: Zap, color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-950/60" },
              { type: "AI", name: "Gemini AI", desc: "Contextual text, summaries, and email generation", icon: Sparkles, color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-950/60" },
              { type: "EMAIL", name: "SMTP Email", desc: "Reliable transactional email dispatch", icon: Mail, color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-950/60" },
              { type: "DELAY", name: "Delay Timer", desc: "Execution pauses & rate limiting", icon: Clock, color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-950/60" },
              { type: "WEBHOOK", name: "Webhook", desc: "HTTP REST sync to external endpoints", icon: Globe, color: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-950/60" },
            ].map((node) => {
              const Icon = node.icon;
              return (
                <div key={node.type} className="rounded-2xl border border-white/[0.08] bg-dark-900/80 p-4 shadow-card">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${node.bg} ${node.color} ${node.border} mb-3 shadow-sm`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">{node.name}</h4>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{node.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}