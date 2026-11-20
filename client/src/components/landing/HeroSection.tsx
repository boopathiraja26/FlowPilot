"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Sparkles,
  Mail,
  Clock,
  Globe,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Activity,
  Play,
  RotateCcw,
  Sliders,
  ChevronRight,
} from "lucide-react";

interface HeroSectionProps {
  onExploreClick?: () => void;
}

interface HeroNode {
  id: string;
  order: string;
  type: "TRIGGER" | "AI" | "EMAIL" | "DELAY" | "WEBHOOK";
  title: string;
  configSummary: string;
  metric: string;
  status: "success" | "active" | "queued";
  icon: typeof Zap;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeColor: string;
  sampleInput: string;
  sampleOutput: string;
}

const HERO_NODES: HeroNode[] = [
  {
    id: "node-1",
    order: "01",
    type: "TRIGGER",
    title: "Webhook Intake",
    configSummary: "POST /api/v1/inbound.lead",
    metric: "14ms",
    status: "success",
    icon: Zap,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-950/40",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    sampleInput: '{"event": "lead.created", "email": "clara@acme.io", "team_size": "25-50"}',
    sampleOutput: '{"status": "accepted", "context_id": "ctx_9921e"}',
  },
  {
    id: "node-2",
    order: "02",
    type: "AI",
    title: "Gemini 2.5 Flash",
    configSummary: "Intent scoring & SDR briefing",
    metric: "320ms",
    status: "success",
    icon: Sparkles,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-950/40",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    sampleInput: 'Prompt: "Classify intent & draft SDR pitch for {{trigger.email}}"',
    sampleOutput: '{"tier": "enterprise", "intent_score": 0.94, "priority": "high"}',
  },
  {
    id: "node-3",
    order: "03",
    type: "EMAIL",
    title: "SMTP Dispatch",
    configSummary: "Send personalized executive deck",
    metric: "88ms",
    status: "success",
    icon: Mail,
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-950/40",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    sampleInput: 'To: {{trigger.email}} | Subject: "FlowPilot Architecture Overview"',
    sampleOutput: '{"messageId": "msg_018fa3", "accepted": ["clara@acme.io"]}',
  },
  {
    id: "node-4",
    order: "04",
    type: "DELAY",
    title: "Smart Delay",
    configSummary: "Wait 15m cooling buffer",
    metric: "15m 00s",
    status: "success",
    icon: Clock,
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-950/40",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    sampleInput: 'Duration: 900 seconds | ResumeStrategy: "exact_time"',
    sampleOutput: '{"status": "resumed", "timer_completed_at": "10:15:00 UTC"}',
  },
  {
    id: "node-5",
    order: "05",
    type: "WEBHOOK",
    title: "CRM Sync",
    configSummary: "POST https://api.crm.internal/v2",
    metric: "62ms",
    status: "success",
    icon: Globe,
    color: "text-rose-400",
    borderColor: "border-rose-500/30",
    bgColor: "bg-rose-950/40",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    sampleInput: 'Payload: {"lead_id": "lead_448", "score": "{{ai.intent_score}}"}',
    sampleOutput: 'HTTP 200 OK | {"crm_record_created": true, "lead_id": 8812}',
  },
];

export function HeroSection({ onExploreClick }: HeroSectionProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node-2");
  const selectedNode = HERO_NODES.find((n) => n.id === selectedNodeId) || HERO_NODES[1];

  return (
    <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28">
      {/* Background subtle technical grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

      {/* Hero content container */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header copy */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1 text-xs text-slate-300 shadow-sm backdrop-blur-md mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-200">FlowPilot v2.4 Engine</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Sequential DAG Automation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Make work flow. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">
              Automatically.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Build powerful automations visually. Connect triggers, AI, emails, and webhooks to turn
            repetitive tasks into reliable workflows.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span>Start Building</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              onClick={onExploreClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-[0.98]"
            >
              <Play className="h-4 w-4 text-blue-400 fill-current" />
              <span>See How It Works</span>
            </a>
          </div>

          {/* Value props badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Visual DAG Builder</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              <span>Gemini 2.5 Intelligence</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <span>Deterministic Execution</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Sub-second Latency</span>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* PRODUCT WORKFLOW PREVIEW (The Visual Centerpiece) */}
        {/* ================================================= */}
        <div className="mt-14 sm:mt-16 rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl overflow-hidden ring-1 ring-white/5">
          {/* Software Window Chrome */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/70 px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Window dots */}
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="text-slate-400 font-sans font-medium">Workflow:</span>
                <span className="text-blue-400 font-semibold">Lead Intake & AI Qualification</span>
                <span className="hidden sm:inline rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                  active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-mono text-slate-400">
              <div className="hidden md:flex items-center gap-1.5 text-slate-400">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span>Run #4912</span>
                <span className="text-emerald-400 font-semibold">Completed in 484ms</span>
              </div>
              <span className="rounded border border-slate-800 bg-slate-950/80 px-2 py-0.5 text-[11px] text-slate-300">
                100% Deterministic
              </span>
            </div>
          </div>

          {/* Workflow Canvas Workspace */}
          <div className="p-4 sm:p-6 lg:p-8 bg-slate-950/80">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wider text-slate-500 font-semibold">
                  Execution Sequence
                </span>
                <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300">
                  5 Steps • Sequential Pipeline
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Click any step to inspect runtime parameters
              </span>
            </div>

            {/* Nodes horizontal stream */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {HERO_NODES.map((node, index) => {
                const Icon = node.icon;
                const isSelected = node.id === selectedNodeId;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`group relative flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? `${node.borderColor} ${node.bgColor} ring-1 ring-blue-500/50 shadow-md`
                        : "border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80"
                    }`}
                  >
                    {/* Top bar with Step index & Status badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {node.order}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold border ${node.badgeColor}`}
                        >
                          {node.type}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        {node.metric}
                      </span>
                    </div>

                    {/* Step icon and Title */}
                    <div className="flex items-center gap-2.5 my-1">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${node.borderColor} ${node.bgColor} ${node.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {node.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate font-mono">
                          {node.configSummary}
                        </p>
                      </div>
                    </div>

                    {/* Active highlight footer */}
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{isSelected ? "Inspecting" : "Select"}</span>
                      <ChevronRight
                        className={`h-3 w-3 transition-transform ${
                          isSelected ? "rotate-90 text-blue-400" : "text-slate-600"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step Parameter Inspector Drawer */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-blue-400" />
                  <span className="font-semibold text-slate-200">
                    Step {selectedNode.order} Inspection:
                  </span>
                  <span className="text-white font-bold">{selectedNode.title}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-semibold border ${selectedNode.badgeColor}`}
                  >
                    {selectedNode.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Execution Time: <span className="text-emerald-400">{selectedNode.metric}</span></span>
                  <span>Exit Code: <span className="text-emerald-400">0 (OK)</span></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-3">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Context Input / Variables
                  </div>
                  <pre className="text-slate-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {selectedNode.sampleInput}
                  </pre>
                </div>

                <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-3">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Execution Output / State Cascade
                  </div>
                  <pre className="text-emerald-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {selectedNode.sampleOutput}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
