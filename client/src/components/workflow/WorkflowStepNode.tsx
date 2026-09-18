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
    glowRing: string;
  }
> = {
  TRIGGER: {
    icon: Zap,
    badgeBg: "bg-emerald-950/70 border-emerald-500/30",
    badgeText: "text-emerald-400",
    borderAccent: "hover:border-emerald-500/50",
    iconBg: "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40",
    glowRing: "ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
  },

  AI: {
    icon: Sparkles,
    badgeBg: "bg-purple-950/70 border-purple-500/30",
    badgeText: "text-purple-400",
    borderAccent: "hover:border-purple-500/50",
    iconBg: "bg-purple-950/80 text-purple-400 border border-purple-500/40",
    glowRing: "ring-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]",
  },

  EMAIL: {
    icon: Mail,
    badgeBg: "bg-blue-950/70 border-blue-500/30",
    badgeText: "text-blue-400",
    borderAccent: "hover:border-blue-500/50",
    iconBg: "bg-blue-950/80 text-blue-400 border border-blue-500/40",
    glowRing: "ring-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
  },

  DELAY: {
    icon: Clock,
    badgeBg: "bg-amber-950/70 border-amber-500/30",
    badgeText: "text-amber-400",
    borderAccent: "hover:border-amber-500/50",
    iconBg: "bg-amber-950/80 text-amber-400 border border-amber-500/40",
    glowRing: "ring-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
  },

  WEBHOOK: {
    icon: Globe,
    badgeBg: "bg-pink-950/70 border-pink-500/30",
    badgeText: "text-pink-400",
    borderAccent: "hover:border-pink-500/50",
    iconBg: "bg-pink-950/80 text-pink-400 border border-pink-500/40",
    glowRing: "ring-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.3)]",
  },
};

// Helper to extract a short preview line from config
function getStepPreview(step: WorkflowStepNodeData["step"]): string {
  const config = (step.config as Record<string, any>) ?? {};
  switch (step.type) {
    case "TRIGGER":
      return "Event: Trigger payload intake";
    case "AI":
      return config.prompt ? `Prompt: "${config.prompt.slice(0, 22)}..."` : "Generate AI content";
    case "EMAIL":
      return "SMTP: Outbound IPv4 relay";
    case "WEBHOOK":
      return config.url ? `URL: ${config.url.slice(0, 20)}...` : "POST Webhook payload";
    case "DELAY":
      return config.milliseconds ? `Wait ${config.milliseconds}ms` : "Wait 5000ms";
    default:
      return "Configured pipeline node";
  }
}

// =========================================================
// WorkflowStepNode Component
// =========================================================

function WorkflowStepNode({
  data,
  selected,
  dragging,
}: NodeProps<WorkflowStepNodeData>) {
  const { step, status, isActive } = data;
  const config = STEP_TYPE_CONFIG[step.type] ?? STEP_TYPE_CONFIG.TRIGGER;
  const Icon = config.icon;
  const preview = getStepPreview(step);

  return (
    <div
      className={`group relative w-72 rounded-2xl border bg-dark-900/95 p-4 shadow-card backdrop-blur-xl transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
        dragging
          ? "scale-[1.02] shadow-2xl border-blue-400/80 ring-2 ring-blue-500/50 z-50 opacity-95"
          : selected
          ? "border-blue-500 ring-2 ring-blue-500/40 shadow-brand-glow scale-[1.01]"
          : isActive
          ? `border-blue-500 ring-4 ${config.glowRing} animate-pulse-glow`
          : `border-white/[0.08] ${config.borderAccent} hover:shadow-card-hover hover:border-white/[0.2]`
      }`}
    >
      {/* Target handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !border-2 !border-dark-950 !bg-slate-500 group-hover:!bg-blue-400 transition-colors shadow-sm"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm ${config.iconBg}`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dark-800 text-[10px] font-bold text-slate-400 border border-white/[0.06] font-mono">
            #{step.stepOrder}
          </span>
        </div>

        {/* Status indicator badge or step type badge */}
        {status === "RUNNING" ? (
          <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-blue-950 px-2 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/30">
            <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-400" />
            <span>Active</span>
          </span>
        ) : status === "COMPLETED" ? (
          <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-emerald-950 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
            <span>Passed</span>
          </span>
        ) : status === "FAILED" ? (
          <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-rose-950 px-2 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/30">
            <AlertCircle className="h-2.5 w-2.5 text-rose-400" />
            <span>Failed</span>
          </span>
        ) : (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}
          >
            {step.type}
          </span>
        )}
      </div>

      {/* Step Info */}
      <div className="mt-3">
        <h4
          className="truncate text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors"
          title={step.name}
        >
          {step.name}
        </h4>

        <p className="mt-1.5 truncate text-[10px] text-slate-400 font-mono bg-dark-950/90 px-2.5 py-1 rounded-lg border border-white/[0.05]">
          {preview}
        </p>
      </div>

      {/* Source handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !border-2 !border-dark-950 !bg-slate-500 group-hover:!bg-blue-400 transition-colors shadow-sm"
      />
    </div>
  );
}

export default WorkflowStepNode;