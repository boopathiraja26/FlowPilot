"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Sparkles,
  Mail,
  Clock,
  Globe,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Check,
  Terminal,
} from "lucide-react";

interface WorkflowNodeDemo {
  id: string;
  stepNumber: string;
  type: "TRIGGER" | "AI" | "EMAIL" | "DELAY" | "WEBHOOK";
  title: string;
  summary: string;
  icon: typeof Zap;
  color: string;
  borderColor: string;
  badgeBg: string;
  sampleInput: string;
  sampleOutput: string;
  revealDelay: number;
}

const HERO_NODES: WorkflowNodeDemo[] = [
  {
    id: "node-trigger",
    stepNumber: "01",
    type: "TRIGGER",
    title: "Form Submission",
    summary: "Inbound customer intake payload",
    icon: Zap,
    color: "text-teal-400",
    borderColor: "border-teal-500/40",
    badgeBg: "bg-teal-500/10 text-teal-300 border-teal-500/20",
    sampleInput: '{"event": "signup.created", "email": "clara@example.com", "tier": "growth"}',
    sampleOutput: '{"status": "accepted", "context_id": "ctx_49102"}',
    revealDelay: 0,
  },
  {
    id: "node-ai",
    stepNumber: "02",
    type: "AI",
    title: "Gemini AI Analysis",
    summary: "Extract intent & classify",
    icon: Sparkles,
    color: "text-indigo-400",
    borderColor: "border-indigo-500/40",
    badgeBg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    sampleInput: 'Prompt: "Classify intent and draft response for {{trigger.email}}"',
    sampleOutput: '{"intent": "workflow_automation", "confidence": 0.94, "priority": "high"}',
    revealDelay: 350,
  },
  {
    id: "node-email",
    stepNumber: "03",
    type: "EMAIL",
    title: "Personalized Email",
    summary: "Deliver custom starter guide",
    icon: Mail,
    color: "text-sky-400",
    borderColor: "border-sky-500/40",
    badgeBg: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    sampleInput: 'To: {{trigger.email}} | Template: "Onboarding Playbook"',
    sampleOutput: '{"status": "delivered", "messageId": "msg_89012a"}',
    revealDelay: 700,
  },
  {
    id: "node-delay",
    stepNumber: "04",
    type: "DELAY",
    title: "15-Minute Buffer",
    summary: "Schedule follow-up window",
    icon: Clock,
    color: "text-amber-400",
    borderColor: "border-amber-500/40",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    sampleInput: "Duration: 900 seconds (15 minutes)",
    sampleOutput: '{"state": "resumed_at_target_time", "status": "active"}',
    revealDelay: 1050,
  },
  {
    id: "node-webhook",
    stepNumber: "05",
    type: "WEBHOOK",
    title: "Sync to Workspace",
    summary: "Update CRM & alert team",
    icon: Globe,
    color: "text-rose-400",
    borderColor: "border-rose-500/40",
    badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    sampleInput: "POST https://api.workspace.internal/v1/sync",
    sampleOutput: 'HTTP 200 OK | {"synced": true, "record_id": "rec_7741"}',
    revealDelay: 1400,
  },
];

export function HeroSection() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node-ai");
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  const [pulseActive, setPulseActive] = useState(false);

  const selectedNode =
    HERO_NODES.find((n) => n.id === selectedNodeId) || HERO_NODES[1];

  // Progressive node reveal on mount
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      setVisibleNodes(new Set(HERO_NODES.map((n) => n.id)));
      setPulseActive(true);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    HERO_NODES.forEach((node) => {
      const t = setTimeout(() => {
        setVisibleNodes((prev) => new Set([...prev, node.id]));
      }, node.revealDelay + 200);
      timers.push(t);
    });

    const pulseTimer = setTimeout(() => setPulseActive(true), 1400 + 200 + 400);
    timers.push(pulseTimer);

    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 bg-[#F8FAF8]"
    >
      {/* Subtle technical background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.08] pointer-events-none" />

      {/* Gentle radiant glow from center top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(ellipse at center, #0D9488 0%, #4F8CFF 50%, transparent 80%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Above-the-fold headline & copy */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Subtle Category Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0D9488]/30 bg-[#E9F5F1] px-4 py-1.5 text-xs font-semibold text-[#0D9488] shadow-xs mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488] animate-pulse" />
            <span>AI-Powered Workflow Automation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#17252F] leading-[1.08]">
            Make work flow. <br />
            <span className="text-[#0D9488]">Automatically.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#4A5E6D] leading-relaxed max-w-2xl mx-auto">
            Design intelligent workflows, connect your tools, and let Gemini AI handle
            the heavy lifting—all from one visual workspace without writing glue code.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register"
              prefetch={true}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-7 py-3.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#0F766E] hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0D9488]"
            >
              <span>Start Building Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#workflow-showcase"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-[#17252F] shadow-xs transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98]"
            >
              <span>Explore the Platform</span>
              <ChevronRight className="h-4 w-4 text-[#0D9488]" />
            </a>
          </div>

          {/* Value bullets */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#5C7280]">
            {[
              "Visual drag-and-drop canvas",
              "Gemini AI step resolution",
              "Webhooks & SMTP emails built-in",
            ].map((bullet) => (
              <div key={bullet} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#0D9488] shrink-0" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================= */}
        {/* WORKFLOW STUDIO PREVIEW (Product Centerpiece)     */}
        {/* ================================================= */}
        <div className="mt-12 sm:mt-16 rounded-2xl border border-[#163A46] bg-[#101C2C] shadow-2xl overflow-hidden ring-1 ring-black/10">
          {/* Software Window Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#163A46]/50 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
              </div>
              <span className="text-slate-600 text-xs hidden sm:inline">|</span>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">Pipeline:</span>
                <span className="text-white font-semibold">Lead Intake & AI Qualification</span>
                <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-300 border border-teal-500/20 font-mono">
                  Saved
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="hidden md:inline text-slate-400">
                5 Steps Connected
              </span>
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-slate-300">
                Visual DAG
              </span>
            </div>
          </div>

          {/* Workflow Canvas Stream */}
          <div className="p-4 sm:p-6 lg:p-8 bg-[#101C2C]">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
              <span className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                Execution Flow · Click any node to inspect parameters
              </span>
              {pulseActive && (
                <span className="flex items-center gap-1.5 text-teal-400 text-[11px]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Pipeline ready
                </span>
              )}
            </div>

            {/* Nodes Row with Progressive Reveal Animation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {HERO_NODES.map((node) => {
                const Icon = node.icon;
                const isSelected = node.id === selectedNodeId;
                const isVisible = visibleNodes.has(node.id);

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`group flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all duration-500 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-3 pointer-events-none"
                    } ${
                      isSelected
                        ? `${node.borderColor} bg-white/[0.08] ring-1 ring-[#0D9488]/60 shadow-lg`
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    {/* Top Row: Index & Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        {node.stepNumber}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold border ${node.badgeBg}`}
                      >
                        {node.type}
                      </span>
                    </div>

                    {/* Node Content */}
                    <div className="flex items-center gap-2.5 my-1">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${node.borderColor} bg-white/5 ${node.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {node.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {node.summary}
                        </p>
                      </div>
                    </div>

                    {/* Footer selector state */}
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{isSelected ? "Inspecting" : "Select"}</span>
                      <ChevronRight
                        className={`h-3 w-3 transition-transform ${
                          isSelected ? "rotate-90 text-teal-400" : "text-slate-600"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inspector Panel for Selected Node */}
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <SlidersHorizontal className="h-4 w-4 text-teal-400" />
                  <span className="text-slate-300 font-semibold">
                    Step {selectedNode.stepNumber} Configuration:
                  </span>
                  <span className="text-white font-bold">{selectedNode.title}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-semibold border ${selectedNode.badgeBg}`}
                  >
                    {selectedNode.type}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  State: Active in DAG
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg bg-black/40 border border-white/5 p-3">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Context Input / Prompt Template
                  </div>
                  <pre className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto">
                    {selectedNode.sampleInput}
                  </pre>
                </div>

                <div className="rounded-lg bg-black/40 border border-white/5 p-3">
                  <div className="text-[11px] font-semibold text-teal-400 mb-1 uppercase tracking-wider">
                    Emitted Context / Output State
                  </div>
                  <pre className="text-teal-200 text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto">
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
