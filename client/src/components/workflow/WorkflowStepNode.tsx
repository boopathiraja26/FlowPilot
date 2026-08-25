"use client";

import { Handle, NodeProps, Position } from "reactflow";
import { Zap, Sparkles, Mail, Clock, Globe, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import { WorkflowStepNodeData } from "@/lib/workflow-flow";
import { WorkflowStepType } from "@/types/workflow";

// =========================================================
// Step type → visual configuration map
// =========================================================

const STEP_TYPE_CONFIG: Record<
  WorkflowStepType,
  {
    icon: typeof Zap;
    badgeBg: string;
    badgeText: string;
    borderAccent: string;
    iconBg: string;
    iconText: string;
    glowRing: string;
  }
> = {
  TRIGGER: {
    icon: Zap,
    badgeBg: "bg-emerald-50 border-emerald-200/80",
    badgeText: "text-emerald-700",
    borderAccent: "hover:border-emerald-400",
    iconBg: "bg-emerald-500",
    iconText: "text-white",
    glowRing: "ring-emerald-400/50 shadow-emerald-500/20",
  },

  AI: {
    icon: Sparkles,
    badgeBg: "bg-purple-50 border-purple-200/80",
    badgeText: "text-purple-700",
    borderAccent: "hover:border-purple-400",
    iconBg: "bg-purple-600",
    iconText: "text-white",
    glowRing: "ring-purple-400/50 shadow-purple-500/20",
  },

  EMAIL: {
    icon: Mail,
    badgeBg: "bg-blue-50 border-blue-200/80",
    badgeText: "text-blue-700",
    borderAccent: "hover:border-blue-400",
    iconBg: "bg-blue-600",
    iconText: "text-white",
    glowRing: "ring-blue-400/50 shadow-blue-500/20",
  },

  DELAY: {
    icon: Clock,
    badgeBg: "bg-amber-50 border-amber-200/80",
    badgeText: "text-amber-700",
    borderAccent: "hover:border-amber-400",
    iconBg: "bg-amber-500",
    iconText: "text-white",
    glowRing: "ring-amber-400/50 shadow-amber-500/20",
  },

  WEBHOOK: {
    icon: Globe,
    badgeBg: "bg-pink-50 border-pink-200/80",
    badgeText: "text-pink-700",
    borderAccent: "hover:border-pink-400",
    iconBg: "bg-pink-600",
    iconText: "text-white",
    glowRing: "ring-pink-400/50 shadow-pink-500/20",
  },
};

// Helper to extract a short preview line from config
function getStepPreview(step: WorkflowStepNodeData["step"]): string {
  const config = (step.config as Record<string, any>) ?? {};
  switch (step.type) {
    case "TRIGGER":
      return "Event: Trigger payload";
    case "AI":
      return config.prompt ? `Prompt: "${config.prompt.slice(0, 22)}..."` : "Generate AI content";
    case "EMAIL":
      return "Recipient: Trigger email";
    case "WEBHOOK":
      return config.url ? `URL: ${config.url.slice(0, 20)}...` : "POST Payload";
    case "DELAY":
      return config.milliseconds ? `Wait ${config.milliseconds}ms` : "Wait 5000ms";
    default:
      return "Configured step";
  }
}

// =========================================================
// WorkflowStepNode Component
// =========================================================

function WorkflowStepNode({
  data,
  selected,
}: NodeProps<WorkflowStepNodeData>) {
  const { step, status, isActive } = data;
  const config = STEP_TYPE_CONFIG[step.type] ?? STEP_TYPE_CONFIG.TRIGGER;
  const Icon = config.icon;
  const preview = getStepPreview(step);

  return (
    <div
      className={`group relative w-64 animate-fade-in rounded-2xl border bg-white p-4 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${
        selected
          ? "border-brand-500 ring-2 ring-brand-500/30 shadow-brand-glow"
          : isActive
          ? `border-brand-500 ring-4 ${config.glowRing} animate-pulse-glow`
          : `border-slate-200 ${config.borderAccent}`
      }`}
    >
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !border-2 !border-white !bg-slate-400 group-hover:!bg-brand-600 transition-colors shadow-sm"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-sm ${config.iconBg} ${config.iconText}`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
            {step.stepOrder}
          </span>
        </div>

        {/* Status indicator badge or step type badge */}
        {status === "RUNNING" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 border border-brand-200">
            <Loader2 className="h-3 w-3 animate-spin text-brand-600" />
            <span>Active</span>
          </span>
        ) : status === "COMPLETED" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Passed</span>
          </span>
        ) : status === "FAILED" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3 text-rose-600" />
            <span>Failed</span>
          </span>
        ) : (
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}
          >
            {step.type}
          </span>
        )}
      </div>

      {/* Step Info */}
      <div className="mt-3">
        <h4
          className="truncate text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors"
          title={step.name}
        >
          {step.name}
        </h4>

        <p className="mt-1 truncate text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          {preview}
        </p>
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !border-2 !border-white !bg-slate-400 group-hover:!bg-brand-600 transition-colors shadow-sm"
      />
    </div>
  );
}

export default WorkflowStepNode;