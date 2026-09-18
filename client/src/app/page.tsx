"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Workflow,
  Zap,
  Sparkles,
  Mail,
  Globe,
  CheckCircle2,
  Loader2,
  ArrowRight,
  GitFork,
  Activity,
  Layers,
  Clock,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Terminal,
  Database,
  Lock,
  Server,
  Code2,
  Check,
  ChevronDown,
  Play,
} from "lucide-react";

// =========================================================
// Custom Hook for Scroll Reveal Animations
// =========================================================

function useInView(options: IntersectionObserverInit = { threshold: 0.15 }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isInView] as const;
}

// =========================================================
// 1. HERO WORKFLOW DEMO (Continuous Engine Loop)
// =========================================================

interface DemoStep {
  id: string;
  type: "TRIGGER" | "AI" | "EMAIL" | "WEBHOOK";
  title: string;
  subtitle: string;
  icon: typeof Zap;
  bg: string;
  text: string;
  border: string;
  glowRing: string;
  dotBg: string;
}

const HERO_DEMO_STEPS: DemoStep[] = [
  {
    id: "hero-step-1",
    type: "TRIGGER",
    title: "Employee Added",
    subtitle: "Webhook: hr.event.signup",
    icon: Zap,
    bg: "bg-emerald-950/70",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    glowRing: "ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.35)]",
    dotBg: "bg-emerald-500",
  },
  {
    id: "hero-step-2",
    type: "AI",
    title: "Generate Welcome",
    subtitle: "Gemini 2.5 Flash: HR Assistant",
    icon: Sparkles,
    bg: "bg-purple-950/70",
    text: "text-purple-400",
    border: "border-purple-500/30",
    glowRing: "ring-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.35)]",
    dotBg: "bg-purple-500",
  },
  {
    id: "hero-step-3",
    type: "EMAIL",
    title: "Send Welcome Email",
    subtitle: "SMTP: alex.rivera@company.com",
    icon: Mail,
    bg: "bg-blue-950/70",
    text: "text-blue-400",
    border: "border-blue-500/30",
    glowRing: "ring-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.35)]",
    dotBg: "bg-blue-500",
  },
  {
    id: "hero-step-4",
    type: "WEBHOOK",
    title: "Sync Team Portal",
    subtitle: "POST: api.company.com/sync",
    icon: Globe,
    bg: "bg-pink-950/70",
    text: "text-pink-400",
    border: "border-pink-500/30",
    glowRing: "ring-pink-500/40 shadow-[0_0_25px_rgba(236,72,153,0.35)]",
    dotBg: "bg-pink-500",
  },
];

function HeroWorkflowDemo() {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [containerRef, isInView] = useInView({ threshold: 0.1 });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setCompletedSteps(new Set([0, 1, 2, 3]));
      setActiveStepIndex(-1);
    }
  }, []);

  useEffect(() => {
    if (!isInView || isReducedMotion) return;

    const interval = setInterval(() => {
      setActiveStepIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;

        if (nextIndex >= HERO_DEMO_STEPS.length) {
          setTimeout(() => {
            setCompletedSteps(new Set());
            setActiveStepIndex(0);
          }, 2200);

          setCompletedSteps(new Set([0, 1, 2, 3]));
          return HERO_DEMO_STEPS.length;
        }

        setCompletedSteps((prev) => new Set([...Array.from(prev), prevIndex]));
        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isInView, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto max-w-5xl rounded-3xl border border-white/[0.1] bg-dark-900/90 p-4 sm:p-7 shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl pointer-events-none hero-glow-1" />
      <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-purple-600/10 blur-3xl pointer-events-none hero-glow-2" />

      {/* Header Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          </div>
          <span className="font-mono text-xs font-semibold text-slate-400 ml-2 truncate">
            pipeline_execution_live.flow
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeStepIndex >= 0 && activeStepIndex < HERO_DEMO_STEPS.length ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/80 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/30 shadow-[0_0_12px_-2px_rgba(59,130,246,0.35)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
              <span>Step {activeStepIndex + 1}: {HERO_DEMO_STEPS[activeStepIndex].title} Running...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_-2px_rgba(16,185,129,0.35)]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Pipeline Passed (100%)</span>
            </span>
          )}
        </div>
      </div>

      {/* Nodes Canvas */}
      <div className="relative min-h-[220px] w-full rounded-2xl bg-dark-950/80 bg-grid-pattern p-4 sm:p-6 border border-white/[0.06] overflow-x-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 min-w-full">
          {HERO_DEMO_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isExecuting = activeStepIndex === index;
            const isDone = completedSteps.has(index) || activeStepIndex > index;
            const isAiNode = index === 1;

            return (
              <div key={step.id} className="flex flex-col lg:flex-row items-center w-full lg:w-1/4 min-w-0">
                {/* Node Card */}
                <div
                  className={`group relative w-full rounded-2xl border p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${
                    isExecuting
                      ? `bg-dark-850 border-blue-500 ring-2 ${step.glowRing} scale-[1.02] z-10`
                      : isDone
                      ? "bg-dark-850/90 border-emerald-500/40 ring-1 ring-emerald-500/20"
                      : "bg-dark-900/80 border-white/[0.08] hover:border-white/[0.2]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                          isExecuting
                            ? "bg-blue-600 text-white shadow-brand-glow"
                            : `${step.bg} ${step.text} border ${step.border}`
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isExecuting && isAiNode ? "animate-spin" : isExecuting ? "animate-pulse" : ""}`} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        #0{index + 1}
                      </span>
                    </div>

                    {isExecuting ? (
                      <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-blue-950 px-2 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/30">
                        <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-400" />
                        <span>Active</span>
                      </span>
                    ) : isDone ? (
                      <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-emerald-950 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                        <span>Passed</span>
                      </span>
                    ) : (
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${step.bg} ${step.text} ${step.border}`}
                      >
                        {step.type}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 min-w-0">
                    <h4 className="truncate text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors" title={step.title}>
                      {step.title}
                    </h4>
                    <p className="mt-1.5 truncate font-mono text-[9px] text-slate-400 bg-dark-950/90 px-2 py-1 rounded-lg border border-white/[0.05]" title={step.subtitle}>
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                {/* Animated Edge Connectors */}
                {index < HERO_DEMO_STEPS.length - 1 && (
                  <>
                    {/* Desktop Horizontal */}
                    <div className="hidden lg:flex items-center justify-center shrink-0 w-8 xl:w-10 relative px-1">
                      <div className="w-full h-1 bg-slate-800 rounded-full relative overflow-hidden">
                        {isDone && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-90 transition-opacity duration-300" />
                        )}
                        {activeStepIndex === index && (
                          <div
                            className="absolute top-0 bottom-0 w-3 bg-gradient-to-r from-blue-400 via-white to-transparent rounded-full shadow-[0_0_10px_#60a5fa]"
                            style={{ animation: "travelParticleX 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Mobile Vertical */}
                    <div className="flex lg:hidden items-center justify-center my-2 h-7 w-full relative">
                      <div className="h-full w-1 bg-slate-800 rounded-full relative overflow-hidden">
                        {isDone && (
                          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500 to-blue-500 opacity-90 transition-opacity duration-300" />
                        )}
                        {activeStepIndex === index && (
                          <div
                            className="absolute left-0 right-0 h-3 bg-gradient-to-b from-blue-400 via-white to-transparent rounded-full shadow-[0_0_10px_#60a5fa]"
                            style={{ animation: "travelParticleY 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// 5. CORE PIPELINE STEP TYPES (Interconnected Workflow Hub)
// =========================================================

interface PipelineNodeDetail {
  id: string;
  type: "TRIGGER" | "AI" | "EMAIL" | "DELAY" | "WEBHOOK";
  title: string;
  tagline: string;
  desc: string;
  icon: typeof Zap;
  color: string;
  borderActive: string;
  iconBg: string;
  badgeBg: string;
  glow: string;
  actionText: string;
}

const PIPELINE_NODES: PipelineNodeDetail[] = [
  {
    id: "node-trigger",
    type: "TRIGGER",
    title: "Trigger Event",
    tagline: "Webhook & Form Intake",
    desc: "Captures incoming HTTP payloads, employee events, or manual form inputs to bootstrap execution context.",
    icon: Zap,
    color: "text-emerald-400",
    borderActive: "border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]",
    iconBg: "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]",
    badgeBg: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
    glow: "rgba(16, 185, 129, 0.4)",
    actionText: "Intake payload parsed",
  },
  {
    id: "node-ai",
    type: "AI",
    title: "Gemini AI Step",
    tagline: "Contextual Resolution",
    desc: "Contextual prompt generation using Gemini 2.5 Flash to write custom emails, summarize data, or analyze intent.",
    icon: Sparkles,
    color: "text-purple-400",
    borderActive: "border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.3)]",
    iconBg: "bg-purple-950/80 text-purple-400 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]",
    badgeBg: "bg-purple-950/60 text-purple-400 border-purple-500/30",
    glow: "rgba(168, 85, 247, 0.4)",
    actionText: "Zero-shot inference",
  },
  {
    id: "node-email",
    type: "EMAIL",
    title: "SMTP Dispatch",
    tagline: "IPv4 Transport",
    desc: "Production IPv4 email transport with dynamic templating, fallback timeout resiliency, and delivery receipts.",
    icon: Mail,
    color: "text-blue-400",
    borderActive: "border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.3)]",
    iconBg: "bg-blue-950/80 text-blue-400 border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]",
    badgeBg: "bg-blue-950/60 text-blue-400 border-blue-500/30",
    glow: "rgba(59, 130, 246, 0.4)",
    actionText: "SMTP 250 OK queued",
  },
  {
    id: "node-delay",
    type: "DELAY",
    title: "Delay & Timer",
    tagline: "Granular Throttling",
    desc: "Configurable wait durations in milliseconds to throttle execution, schedule delayed notices, or prevent API rate limits.",
    icon: Clock,
    color: "text-amber-400",
    borderActive: "border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.3)]",
    iconBg: "bg-amber-950/80 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
    badgeBg: "bg-amber-950/60 text-amber-400 border-amber-500/30",
    glow: "rgba(245, 158, 11, 0.4)",
    actionText: "Wait timer active",
  },
  {
    id: "node-webhook",
    type: "WEBHOOK",
    title: "HTTP Webhook",
    tagline: "Universal REST Call",
    desc: "Dispatches GET, POST, PUT, PATCH, or DELETE requests to external microservices with variable payload substitutions.",
    icon: Globe,
    color: "text-pink-400",
    borderActive: "border-pink-500/50 shadow-[0_0_25px_rgba(236,72,153,0.3)]",
    iconBg: "bg-pink-950/80 text-pink-400 border border-pink-500/40 shadow-[0_0_12px_rgba(236,72,153,0.3)]",
    badgeBg: "bg-pink-950/60 text-pink-400 border-pink-500/30",
    glow: "rgba(236, 72, 153, 0.4)",
    actionText: "HTTP 200 broadcast",
  },
];

function CorePipelineStepVisualization() {
  const [sectionRef, isInView] = useInView({ threshold: 0.1 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activePulseNode, setActivePulseNode] = useState<number>(0);

  // Auto pulsing cycle across nodes
  useEffect(() => {
    if (!isInView) return;
    const timer = setInterval(() => {
      setActivePulseNode((prev) => (prev + 1) % PIPELINE_NODES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [isInView]);

  return (
    <div ref={sectionRef} className="relative mt-12">
      {/* Visual Interconnected Workflow Canvas */}
      <div className="rounded-3xl border border-white/[0.08] bg-dark-900/90 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-grid-subtle opacity-40 pointer-events-none" />

        {/* Dynamic ambient hub glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none hero-glow-3" />

        {/* Top Workflow Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5 mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-brand-glow">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">FlowPilot Engine Node Architecture</h3>
              <p className="text-[11px] font-mono text-slate-400">Interoperable execution graph • 5 primitive node types</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>Full Pipeline Connectivity</span>
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* Desktop Hub & Nodes Layout */}
        {/* ========================================================= */}
        <div className="relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PIPELINE_NODES.map((node, index) => {
              const Icon = node.icon;
              const isHovered = hoveredNode === node.id;
              const isPulsing = activePulseNode === index;

              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer ${
                    isHovered || isPulsing
                      ? `bg-dark-850 ${node.borderActive} scale-[1.02]`
                      : "bg-dark-950/70 border-white/[0.08] hover:border-white/[0.18] shadow-card hover:shadow-card-hover"
                  }`}
                >
                  {/* Top Node Meta */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${node.iconBg}`}>
                        <Icon className={`h-5 w-5 ${
                          node.type === "TRIGGER" ? "animate-pulse" :
                          node.type === "AI" ? "animate-spin-slow" :
                          node.type === "EMAIL" ? "group-hover:translate-x-0.5" :
                          node.type === "DELAY" ? "animate-pulse" : ""
                        }`} />
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${node.badgeBg}`}>
                        {node.type}
                      </span>
                    </div>

                    <h4 className="mt-4 text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                      {node.title}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      {node.tagline}
                    </span>

                    <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">
                      {node.desc}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                      {node.actionText}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${isPulsing || isHovered ? "bg-emerald-400 animate-ping" : "bg-slate-700"}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connected Flow Stream Banner underneath */}
          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-dark-950/80 p-4 font-mono text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Terminal className="h-4 w-4 text-blue-400 shrink-0" />
              <span className="text-[11px] text-slate-300">
                Pipeline Sequence: <span className="text-emerald-400 font-bold">TRIGGER</span> → <span className="text-purple-400 font-bold">AI</span> → <span className="text-blue-400 font-bold">EMAIL</span> → <span className="text-amber-400 font-bold">DELAY</span> → <span className="text-pink-400 font-bold">WEBHOOK</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Full Variable Context Passing Supported</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// 7. AI AUTOMATION TYPING SIMULATOR
// =========================================================

function AiAutomationShowcase() {
  const [sectionRef, isInView] = useInView({ threshold: 0.2 });
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const fullPromptOutput =
    "Subject: Welcome to the Platform Team, Alex!\n\nWe're thrilled to welcome you as Lead Architect in Core Platform. Your onboarding kickoff is scheduled for 10:00 AM UTC. Your platform credentials and developer sandbox are configured.";

  useEffect(() => {
    if (!isInView) return;

    let currentIndex = 0;
    setIsTyping(true);
    setTypedText("");

    const interval = setInterval(() => {
      if (currentIndex < fullPromptOutput.length) {
        setTypedText(fullPromptOutput.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={sectionRef} className="mt-12 rounded-3xl border border-white/[0.08] bg-dark-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center relative z-10">
        {/* Input Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-dark-950 p-5 shadow-card hover:border-white/[0.16] transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trigger Prompt Input</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">Payload</span>
          </div>
          <div className="mt-3 font-mono text-xs text-slate-300 space-y-1.5">
            <p className="text-blue-400">employee_name: <span className="text-slate-200">&quot;Alex Rivera&quot;</span></p>
            <p className="text-blue-400">job_title: <span className="text-slate-200">&quot;Lead Architect&quot;</span></p>
            <p className="text-blue-400">department: <span className="text-slate-200">&quot;Core Platform&quot;</span></p>
            <p className="text-slate-400 mt-2 text-[11px] leading-relaxed bg-dark-900/80 p-2.5 rounded-lg border border-white/[0.04]">
              &gt; prompt: &quot;Generate a warm executive welcome email with team instructions and sandbox access info...&quot;
            </p>
          </div>
        </div>

        {/* Center AI Engine Processor */}
        <div className="flex flex-col items-center justify-center text-center p-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-pulse-glow">
              <Sparkles className="h-8 w-8 animate-glow-soft" />
            </div>
            {isTyping && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500 text-[8px] items-center justify-center font-bold text-white">AI</span>
              </span>
            )}
          </div>

          <h4 className="mt-3 text-sm font-bold text-white">Gemini 2.5 Resolution</h4>
          <p className="mt-1 text-[11px] text-purple-300 font-mono">latency: ~380ms</p>
          
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-purple-950/50 px-3 py-1 rounded-full border border-purple-500/20">
            <span className={`h-1.5 w-1.5 rounded-full ${isTyping ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
            <span>{isTyping ? "Streaming tokens..." : "Zero-Shot Token Ready"}</span>
          </div>
        </div>

        {/* Output Result Stream Card */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 shadow-[0_0_25px_rgba(168,85,247,0.15)] min-h-[170px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Generated AI Output</span>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/30">
                {isTyping ? "Generating..." : "Ready"}
              </span>
            </div>

            <div className="mt-3 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
              {typedText}
              {isTyping && <span className="inline-block w-1.5 h-3.5 bg-purple-400 ml-1 animate-typing-cursor align-middle" />}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-purple-500/20 flex items-center justify-between text-[10px] font-mono text-purple-300/70">
            <span>Tokens: 420 resolved</span>
            <span>Temperature: 0.2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// 8. LIVE EXECUTION TIMELINE OBSERVABILITY
// =========================================================

interface TimelineLogItem {
  time: string;
  tag: string;
  tagColor: string;
  message: string;
  latency: string;
}

const TIMELINE_LOGS: TimelineLogItem[] = [
  {
    time: "11:32:01.102",
    tag: "[TRIGGER]",
    tagColor: "text-emerald-400",
    message: "Webhook received from hr.event.signup • payload validated",
    latency: "42ms",
  },
  {
    time: "11:32:01.145",
    tag: "[AI_RESOLVE]",
    tagColor: "text-purple-400",
    message: "Gemini 2.5 context resolved • welcome message generated",
    latency: "380ms",
  },
  {
    time: "11:32:01.525",
    tag: "[SMTP_EMAIL]",
    tagColor: "text-blue-400",
    message: "IPv4 handshake complete • message delivered to alex.rivera@company.com",
    latency: "290ms",
  },
  {
    time: "11:32:01.815",
    tag: "[WEBHOOK]",
    tagColor: "text-pink-400",
    message: "POST https://api.company.com/sync • HTTP 200 OK",
    latency: "140ms",
  },
];

function LiveExecutionTimeline() {
  const [sectionRef, isInView] = useInView({ threshold: 0.15 });
  const [visibleLogsCount, setVisibleLogsCount] = useState<number>(0);

  useEffect(() => {
    if (!isInView) return;

    setVisibleLogsCount(1);
    const interval = setInterval(() => {
      setVisibleLogsCount((prev) => {
        if (prev < TIMELINE_LOGS.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={sectionRef} className="mt-12 rounded-3xl border border-white/[0.08] bg-dark-900/90 p-6 shadow-2xl overflow-hidden backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <span className="font-mono text-xs font-bold text-slate-200">execution_log_run_7f8a9b.log</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          <Check className="h-3 w-3 stroke-[3]" />
          <span>COMPLETED • 852ms total</span>
        </span>
      </div>

      <div className="space-y-2.5 font-mono text-xs text-slate-300">
        {TIMELINE_LOGS.map((item, index) => {
          const isVisible = index < visibleLogsCount;

          return (
            <div
              key={item.tag}
              className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-dark-950/80 border border-white/[0.04] transition-all duration-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-slate-500 text-[11px]">{item.time}</span>
                <span className={`${item.tagColor} font-bold text-[11px]`}>{item.tag}</span>
                <span className="text-slate-300 text-xs truncate">{item.message}</span>
              </div>
              <span className="text-slate-500 text-[11px] ml-auto shrink-0 font-mono">{item.latency}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================
// 10. REAL WORKFLOW SHOWCASE (Onboarding Engine)
// =========================================================

interface ShowcaseStepItem {
  id: string;
  order: string;
  type: string;
  title: string;
  subtitle: string;
  description: string;
  payload: string;
  icon: typeof Zap;
  activeBorder: string;
  iconBg: string;
  badgeBg: string;
  glowColor: string;
  logTag: string;
  logMessage: string;
  duration: string;
}

const ONBOARDING_STEPS: ShowcaseStepItem[] = [
  {
    id: "step-onboard-1",
    order: "01",
    type: "TRIGGER",
    title: "Employee Added",
    subtitle: "hr.event.employee_added",
    description: "Captures HR webhook event & parses employee profile",
    payload: "alex.rivera@company.com",
    icon: Zap,
    activeBorder: "border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]",
    iconBg: "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40",
    badgeBg: "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30",
    glowColor: "#10b981",
    logTag: "[TRIGGER]",
    logMessage: "HR signup webhook captured • Alex Rivera (Lead Architect)",
    duration: "42ms",
  },
  {
    id: "step-onboard-2",
    order: "02",
    type: "AI AGENT",
    title: "Generate Welcome",
    subtitle: "Gemini 2.5: Contextual Prompt",
    description: "Generates personalized executive welcome letter & intro",
    payload: "Resolved prompt: 420 tokens",
    icon: Sparkles,
    activeBorder: "border-purple-500 ring-4 ring-purple-500/50 shadow-[0_0_35px_rgba(168,85,247,0.45)]",
    iconBg: "bg-purple-950/80 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]",
    badgeBg: "bg-purple-950/70 text-purple-400 border border-purple-500/40",
    glowColor: "#a855f7",
    logTag: "[AI_AGENT]",
    logMessage: "Gemini 2.5 Flash resolved contextual welcome email template",
    duration: "380ms",
  },
  {
    id: "step-onboard-3",
    order: "03",
    type: "SMTP EMAIL",
    title: "Send Welcome Email",
    subtitle: "IPv4 Relay: alex.rivera@company.com",
    description: "Dispatches onboarding HTML packet with delivery confirmation",
    payload: "SMTP 250 OK: Queued",
    icon: Mail,
    activeBorder: "border-blue-500 ring-2 ring-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)]",
    iconBg: "bg-blue-950/80 text-blue-400 border border-blue-500/40",
    badgeBg: "bg-blue-950/70 text-blue-400 border border-blue-500/30",
    glowColor: "#3b82f6",
    logTag: "[SMTP_EMAIL]",
    logMessage: "Outbound welcome email delivered to alex.rivera@company.com",
    duration: "290ms",
  },
  {
    id: "step-onboard-4",
    order: "04",
    type: "WEBHOOK SYNC",
    title: "Sync Team Portal",
    subtitle: "POST: api.company.com/team/sync",
    description: "Broadcasts active status to company directory & Slack",
    payload: "HTTP 200 OK: Synced",
    icon: Globe,
    activeBorder: "border-pink-500 ring-2 ring-pink-500/40 shadow-[0_0_25px_rgba(236,72,153,0.3)]",
    iconBg: "bg-pink-950/80 text-pink-400 border border-pink-500/40",
    badgeBg: "bg-pink-950/70 text-pink-400 border border-pink-500/30",
    glowColor: "#ec4899",
    logTag: "[WEBHOOK]",
    logMessage: "POST /api/team/sync HTTP 200 OK • Workspace synchronized",
    duration: "140ms",
  },
];

function OnboardingWorkflowShowcase() {
  const [sectionRef, isInView] = useInView({ threshold: 0.15 });
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      setCompletedSteps(new Set([0, 1, 2, 3]));
      setActiveStepIndex(-1);
    }
  }, []);

  useEffect(() => {
    if (!isInView || isReducedMotion) return;

    const interval = setInterval(() => {
      setActiveStepIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;

        if (nextIndex >= ONBOARDING_STEPS.length) {
          setTimeout(() => {
            setCompletedSteps(new Set());
            setActiveStepIndex(0);
          }, 2600);

          setCompletedSteps(new Set([0, 1, 2, 3]));
          return ONBOARDING_STEPS.length;
        }

        setCompletedSteps((prev) => new Set([...Array.from(prev), prevIndex]));
        return nextIndex;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [isInView, isReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={`py-24 border-t border-white/[0.08] bg-gradient-to-b from-dark-950 via-dark-900/60 to-dark-950 relative overflow-hidden transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-90 translate-y-2"
      }`}
    >
      {/* Dynamic Ambient Glow centered behind the AI node */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-purple-600/10 blur-[120px] -z-10" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px] -z-10" />

      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3.5 py-1 text-xs font-bold text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)] mb-3">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            <span>REAL-WORLD AUTOMATION PIPELINE</span>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl lg:text-5xl">
            Real Workflow:{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
              Employee Onboarding
            </span>
          </h2>

          <p className="mt-4 text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Watch how FlowPilot coordinates trigger intake, Gemini AI resolution, SMTP email dispatch, and webhook synchronization in real time.
          </p>
        </div>

        {/* Workflow Showcase Box */}
        <div className="mt-14 rounded-3xl border border-white/[0.08] bg-dark-900/90 p-5 sm:p-8 shadow-2xl backdrop-blur-2xl">
          {/* Top Engine Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark-950 border border-white/[0.08] text-blue-400 shadow-sm">
                <Workflow className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">onboarding_pipeline_prod.v2</span>
                <span className="text-[10px] font-mono text-slate-500">trigger: hr.webhook • 4 nodes</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeStepIndex >= 0 && activeStepIndex < ONBOARDING_STEPS.length ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/80 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                  <span>Step {activeStepIndex + 1}: {ONBOARDING_STEPS[activeStepIndex].title} Running...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Workflow Execution Passed (100%)</span>
                </span>
              )}
            </div>
          </div>

          {/* 4 Connected Nodes Grid */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-0 min-w-full">
            {ONBOARDING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isExecuting = activeStepIndex === index;
              const isDone = completedSteps.has(index) || activeStepIndex > index;
              const isAiNode = index === 1;

              return (
                <div key={step.id} className="flex flex-col lg:flex-row items-center w-full lg:w-1/4 min-w-0">
                  {/* Node Card */}
                  <div
                    className={`group relative w-full rounded-2xl border p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 cursor-default ${
                      isExecuting
                        ? `bg-dark-850 ${step.activeBorder} scale-[1.02] z-10`
                        : isDone
                        ? "bg-dark-850/90 border-emerald-500/40 ring-1 ring-emerald-500/20"
                        : "bg-dark-900/80 border-white/[0.08] hover:border-white/[0.2] hover:shadow-card-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${
                            isExecuting
                              ? `${step.iconBg} scale-105`
                              : isDone
                              ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/40"
                              : "bg-dark-950 text-slate-500 border border-white/[0.06]"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isExecuting && isAiNode ? "animate-spin" : isExecuting ? "animate-pulse" : ""}`} />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                          #{step.order}
                        </span>
                      </div>

                      {/* State Badge */}
                      {isExecuting ? (
                        <span
                          className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            isAiNode
                              ? "bg-purple-950 text-purple-300 border border-purple-500/40"
                              : index === 2
                              ? "bg-blue-950 text-blue-300 border border-blue-500/40"
                              : index === 3
                              ? "bg-pink-950 text-pink-300 border border-pink-500/40"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          <span>{isAiNode ? "Resolving..." : index === 2 ? "Sending..." : index === 3 ? "Syncing..." : "Active"}</span>
                        </span>
                      ) : isDone ? (
                        <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-white/[0.06] bg-dark-950 px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          Waiting
                        </span>
                      )}
                    </div>

                    <div className="mt-3.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors" title={step.title}>
                          {step.title}
                        </h4>
                        {isAiNode && (
                          <span className="rounded bg-purple-500/20 px-1 py-0.2 text-[8px] font-bold text-purple-300 border border-purple-500/30 uppercase">
                            AI
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500 truncate" title={step.payload}>
                        {step.payload}
                      </span>
                      <span className="text-slate-500 shrink-0 ml-1">
                        {step.duration}
                      </span>
                    </div>

                    {isAiNode && isExecuting && (
                      <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-dark-950 overflow-hidden rounded-full">
                        <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-blue-500 animate-shimmer" />
                      </div>
                    )}
                  </div>

                  {/* Connectors */}
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <>
                      {/* Desktop */}
                      <div className="hidden lg:flex items-center justify-center shrink-0 w-8 xl:w-10 relative px-1">
                        <div className="w-full h-1 bg-slate-800 rounded-full relative overflow-hidden">
                          {isDone && (
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-90 transition-opacity duration-300" />
                          )}
                          {activeStepIndex === index && (
                            <div
                              className="absolute top-0 bottom-0 w-3 bg-gradient-to-r from-blue-400 via-white to-transparent rounded-full shadow-[0_0_10px_#60a5fa]"
                              style={{ animation: "travelParticleX 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="flex lg:hidden items-center justify-center my-2 h-7 w-full relative">
                        <div className="h-full w-1 bg-slate-800 rounded-full relative overflow-hidden">
                          {isDone && (
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500 to-blue-500 opacity-90 transition-opacity duration-300" />
                          )}
                          {activeStepIndex === index && (
                            <div
                              className="absolute left-0 right-0 h-3 bg-gradient-to-b from-blue-400 via-white to-transparent rounded-full shadow-[0_0_10px_#60a5fa]"
                              style={{ animation: "travelParticleY 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Telemetry log stream */}
          <div className="mt-8 pt-6 border-t border-white/[0.08]">
            <div className="rounded-2xl border border-white/[0.06] bg-dark-950 p-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-blue-400" />
                  <span className="text-slate-200 font-bold text-[11px] uppercase tracking-wider">
                    Pipeline Telemetry • live_onboarding_stream
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {completedSteps.size}/4 STEPS COMPLETE
                </span>
              </div>

              <div className="space-y-2">
                {ONBOARDING_STEPS.map((step, idx) => {
                  const isCurrent = activeStepIndex === idx;
                  const isPassed = completedSteps.has(idx) || activeStepIndex > idx;

                  return (
                    <div
                      key={step.id}
                      className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl transition-all duration-300 ${
                        isCurrent
                          ? "bg-dark-900 border border-blue-500/40 text-slate-100 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                          : isPassed
                          ? "bg-dark-900/40 border border-white/[0.03] text-slate-300 opacity-90"
                          : "text-slate-600 opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isCurrent ? (
                          <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping shrink-0" />
                        ) : isPassed ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 stroke-[3]" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-slate-700 shrink-0" />
                        )}

                        <span className={`text-[10px] font-bold uppercase shrink-0 ${
                          idx === 0 ? "text-emerald-400" : idx === 1 ? "text-purple-400" : idx === 2 ? "text-blue-400" : "text-pink-400"
                        }`}>
                          {step.logTag}
                        </span>

                        <span className="text-xs truncate">{step.logMessage}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 ml-auto shrink-0">
                        <span>latency: {step.duration}</span>
                        {isCurrent ? (
                          <span className="text-blue-400 font-bold animate-pulse">RUNNING</span>
                        ) : isPassed ? (
                          <span className="text-emerald-400 font-bold">PASSED</span>
                        ) : (
                          <span className="text-slate-600">QUEUED</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// MAIN LANDING PAGE COMPONENT
// =========================================================

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll listener for premium navbar transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [howItWorksRef, howItWorksInView] = useInView({ threshold: 0.15 });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.15 });
  const [integrationsRef, integrationsInView] = useInView({ threshold: 0.15 });
  const [securityRef, securityInView] = useInView({ threshold: 0.15 });
  const [faqRef, faqInView] = useInView({ threshold: 0.15 });
  const [ctaRef, ctaInView] = useInView({ threshold: 0.15 });

  const faqs = [
    {
      q: "What is FlowPilot?",
      a: "FlowPilot is a high-performance SaaS workflow automation platform that enables developers and teams to orchestrate multi-step pipelines powered by Gemini AI, reliable SMTP email dispatch, custom HTTP webhooks, and granular delay timers.",
    },
    {
      q: "What can I automate with FlowPilot?",
      a: "You can automate employee onboarding, customer outreach, lead enrichment, webhook integrations, operational notifications, AI content generation, and background pipeline processing with real-time telemetry.",
    },
    {
      q: "How does the AI step work?",
      a: "The AI step resolves prompts dynamically using Google's Gemini 2.5 Flash model. It ingests variables and upstream step outputs from trigger events and generates context-aware text, emails, or structured payloads.",
    },
    {
      q: "What workflow step types are supported?",
      a: "FlowPilot natively supports 5 core step types: Trigger (webhook/payload intake), AI Assistant (Gemini generation), Email (SMTP IPv4 dispatch), Delay (timed execution pauses), and Webhook (HTTP POST/GET/PUT calls).",
    },
    {
      q: "Can I use custom webhooks?",
      a: "Yes. You can configure Webhook steps with custom HTTP endpoints, methods (GET, POST, PUT, PATCH, DELETE), custom headers, and dynamic JSON payload variables resolved at execution time.",
    },
    {
      q: "How are workflow executions monitored?",
      a: "Every run is logged with millisecond duration tracking, step-by-step status badges (COMPLETED, RUNNING, FAILED), terminal logs, and live observability screens.",
    },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden">
      {/* Global Ambient Glows */}
      <div className="pointer-events-none fixed top-0 left-1/3 h-[600px] w-[600px] rounded-full bg-blue-600/[0.07] blur-[140px] -z-10 hero-glow-1" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-indigo-600/[0.06] blur-[140px] -z-10 hero-glow-2" />

      {/* ================================================= */}
      {/* 1. NAVBAR */}
      {/* ================================================= */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-white/[0.1] bg-dark-950/85 backdrop-blur-xl shadow-lg"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform duration-200 hover:-translate-y-0.5"
            title="FlowPilot Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-brand-glow transition-all duration-200 group-hover:shadow-brand-glow-lg group-hover:scale-105">
              <Workflow className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-white group-hover:text-blue-400 transition-colors leading-none">
                FlowPilot
              </span>
              <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase mt-0.5">
                Automations
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <a href="#how-it-works" className="nav-link-animated hover:text-slate-100 transition-colors">How It Works</a>
            <a href="#step-types" className="nav-link-animated hover:text-slate-100 transition-colors">Step Types</a>
            <a href="#ai-automation" className="nav-link-animated hover:text-slate-100 transition-colors">AI Engine</a>
            <a href="#features" className="nav-link-animated hover:text-slate-100 transition-colors">Features</a>
            <a href="#integrations" className="nav-link-animated hover:text-slate-100 transition-colors">Integrations</a>
            <a href="#faq" className="nav-link-animated hover:text-slate-100 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-300 transition-all duration-150 hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-brand-glow transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-brand-glow-lg hover:-translate-y-0.5 active:scale-[0.98] border border-blue-400/20"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================================================= */}
      {/* 2. HERO SECTION */}
      {/* ================================================= */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Subtle Ambient Floating Background Particles */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/5 h-2 w-2 rounded-full bg-blue-400/40 animate-float-slow blur-[1px]" />
          <div className="absolute top-1/3 right-1/4 h-3 w-3 rounded-full bg-purple-400/30 animate-float-slower blur-[1px]" />
          <div className="absolute bottom-1/3 left-1/3 h-2.5 w-2.5 rounded-full bg-emerald-400/30 animate-float blur-[1px]" />
        </div>

        <div className="mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-4 py-1.5 text-xs font-bold text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.25)] animate-fade-in hover:scale-105 transition-transform cursor-default">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-spin-slow" />
            <span>AI-POWERED WORKFLOW AUTOMATION</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1] animate-fade-up">
            Automate the work. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent gradient-text-animated">
              Let AI handle the flow.
            </span>
          </h1>

          {/* Supporting text */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 leading-relaxed sm:text-lg animate-fade-up-d1">
            Build end-to-end automated pipelines with Gemini AI content resolution, SMTP email dispatch, webhooks, and step-by-step execution tracking.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up-d2">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-brand-glow transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-brand-glow-lg hover:-translate-y-1 active:scale-[0.98] border border-blue-400/25"
            >
              <span>Start Building — It&apos;s Free</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <a
              href="#workflow-demo"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-dark-900/80 px-6 py-3.5 text-sm font-bold text-slate-300 shadow-subtle transition-all duration-200 hover:bg-dark-800 hover:border-white/[0.2] hover:text-white hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Play className="h-3.5 w-3.5 fill-current text-blue-400" />
              <span>Explore Demo</span>
            </a>
          </div>

          {/* Trust Metadata */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium animate-fade-up-d3">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400 stroke-[3]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400 stroke-[3]" />
              <span>Gemini 2.5 Flash integrated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400 stroke-[3]" />
              <span>Production SMTP ready</span>
            </div>
          </div>
        </div>

        {/* 3. Animated Workflow Demo */}
        <div id="workflow-demo" className="mt-14 px-4 sm:px-6">
          <HeroWorkflowDemo />
        </div>
      </section>

      {/* ================================================= */}
      {/* 4. HOW FLOWPILOT WORKS */}
      {/* ================================================= */}
      <section
        id="how-it-works"
        ref={howItWorksRef}
        className={`border-t border-white/[0.08] bg-dark-900/50 py-24 transition-all duration-700 ${
          howItWorksInView ? "opacity-100 translate-y-0" : "opacity-90 translate-y-4"
        }`}
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Simple 3-Step Setup</span>
            <h2 className="mt-1 text-3xl font-black text-white tracking-tight sm:text-4xl">
              How FlowPilot Executes Automations
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto">
              From trigger payload to final webhook dispatch, orchestrate intelligent pipelines seamlessly.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3 relative">
            {[
              {
                num: "01",
                title: "Define Trigger",
                desc: "Capture webhook events, forms, or runtime parameters in plain text to kick off the pipeline.",
                icon: GitFork,
              },
              {
                num: "02",
                title: "Connect Steps",
                desc: "Connect Gemini AI resolution, SMTP Email dispatch, custom Webhook POSTs, and Delay timers.",
                icon: Layers,
              },
              {
                num: "03",
                title: "Execute & Monitor",
                desc: "Run pipeline executions with live step-by-step output tracking, duration logs, and status badges.",
                icon: Activity,
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className={`group relative rounded-2xl border border-white/[0.08] bg-dark-900/80 p-6 shadow-card transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/40 hover:shadow-brand-glow ${
                    howItWorksInView ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-black text-blue-400/80 group-hover:text-blue-400 transition-colors">
                      {step.num}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950/60 text-blue-400 border border-blue-500/30 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-[0_0_12px_-2px_rgba(59,130,246,0.3)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* 5. 5 CORE PIPELINE STEP TYPES (Workflow Visualization) */}
      {/* ================================================= */}
      <section id="step-types" className="py-24 border-t border-white/[0.08] bg-dark-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Supported Nodes</span>
            <h2 className="mt-1 text-3xl font-black text-white tracking-tight sm:text-4xl">
              5 Core Pipeline Step Types
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto">
              Every step is modular, strictly validated, and interoperable across your execution pipeline.
            </p>
          </div>

          <CorePipelineStepVisualization />
        </div>
      </section>

      {/* ================================================= */}
      {/* 6. AI AUTOMATION ENGINE */}
      {/* ================================================= */}
      <section id="ai-automation" className="py-24 border-t border-white/[0.08] bg-dark-900/40">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Gemini 2.5 Flash Engine</span>
            <h2 className="mt-1 text-3xl font-black text-white tracking-tight sm:text-4xl">
              Context-Aware AI Workflow Resolution
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
              FlowPilot feeds upstream context and trigger parameters directly into Gemini AI to generate customized messages and structured actions.
            </p>
          </div>

          <AiAutomationShowcase />
        </div>
      </section>

      {/* ================================================= */}
      {/* 7. LIVE EXECUTION OBSERVABILITY */}
      {/* ================================================= */}
      <section className="py-24 border-t border-white/[0.08] bg-dark-950">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Observability & Logs</span>
            <h2 className="mt-1 text-3xl font-black text-white tracking-tight sm:text-4xl">
              Real-Time Execution Monitoring
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto">
              Every step execution emits detailed logs, status codes, and timing metrics.
            </p>
          </div>

          <LiveExecutionTimeline />
        </div>
      </section>

      {/* ================================================= */}
      {/* 8. INTEGRATIONS */}
      {/* ================================================= */}
      <section
        id="integrations"
        ref={integrationsRef}
        className={`py-24 border-t border-white/[0.08] bg-dark-900/40 transition-all duration-700 ${
          integrationsInView ? "opacity-100 translate-y-0" : "opacity-90 translate-y-4"
        }`}
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Seamless Stacks</span>
            <h2 className="mt-1 text-3xl font-black text-white tracking-tight sm:text-4xl">
              Supported Integrations
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto">
              Production-ready primitives engineered directly into FlowPilot.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Google Gemini AI",
                desc: "Contextual generation with Gemini 2.5 Flash for ultra-fast step resolution.",
                icon: Sparkles,
                badge: "AI Engine",
              },
              {
                title: "SMTP Transport",
                desc: "IPv4 resilient email transport with fallback support and delivery receipts.",
                icon: Mail,
                badge: "Email Relay",
              },
              {
                title: "Custom Webhooks",
                desc: "Universal HTTP POST/GET/PUT integration with custom header and payload support.",
                icon: Globe,
                badge: "REST API",
              },
              {
                title: "PostgreSQL & Prisma",
                desc: "Reliable relational schema persistence with ACID workflow guarantees.",
                icon: Database,
                badge: "Database",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-white/[0.08] bg-dark-900/80 p-6 shadow-card hover:border-blue-500/40 hover:shadow-brand-glow hover:-translate-y-2 transition-all duration-300"
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950/60 text-blue-400 border border-blue-500/30 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-dark-800 px-2 py-0.5 rounded border border-white/[0.06]">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* 9. SECURITY & RELIABILITY */}
      {/* ================================================= */}
      <section
        ref={securityRef}
        className={`py-24 border-t border-white/[0.08] bg-dark-950 transition-all duration-700 ${
          securityInView ? "opacity-100 translate-y-0" : "opacity-90 translate-y-4"
        }`}
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Enterprise Grade</span>
            <h2 className="mt-1 text-3xl font-black text-white tracking-tight sm:text-4xl">
              Security & Reliability First
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto">
              FlowPilot implements modern security standards to safeguard your workflow data.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "JWT & HTTP-Only Cookies",
                desc: "Strict session storage preventing XSS vulnerabilities and credential leaks.",
                icon: Lock,
              },
              {
                title: "Rate Limiting Controls",
                desc: "Intelligent throttling prevents runaway loops and protects upstream APIs.",
                icon: ShieldCheck,
              },
              {
                title: "Sanitized Environment Secrets",
                desc: "Credentials, SMTP passwords, and API keys are strictly masked and isolated.",
                icon: Server,
              },
              {
                title: "Execution Logging",
                desc: "Complete audit trails with timestamps, step outputs, and error diagnostics.",
                icon: Terminal,
              },
              {
                title: "Type-Safe Zod Schemas",
                desc: "Runtime payload validation ensures zero malformed step configurations.",
                icon: Code2,
              },
              {
                title: "Resilient Error Recovery",
                desc: "Step-level exception isolation prevents silent failure cascades.",
                icon: CheckCircle2,
              },
            ].map((sec) => {
              const Icon = sec.icon;
              return (
                <div
                  key={sec.title}
                  className="group rounded-2xl border border-white/[0.08] bg-dark-900/80 p-5 shadow-card hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {sec.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-xs text-slate-400 leading-relaxed">{sec.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* 10. REAL WORKFLOW EXAMPLE (Employee Onboarding) */}
      {/* ================================================= */}
      <OnboardingWorkflowShowcase />

      {/* ================================================= */}
      {/* 11. CORE FEATURES GRID */}
      {/* ================================================= */}
      <section
        id="features"
        ref={featuresRef}
        className={`py-24 border-t border-white/[0.08] bg-dark-950 transition-all duration-700 ${
          featuresInView ? "opacity-100 translate-y-0" : "opacity-90 translate-y-4"
        }`}
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Engine Features</span>
            <h2 className="mt-1 text-3xl font-black text-white tracking-tight sm:text-4xl">
              Engineered for Developers & Modern Teams
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Cpu,
                title: "Gemini AI Step Resolution",
                desc: "Contextual AI content generation directly inside execution pipelines.",
              },
              {
                icon: Mail,
                title: "Reliable SMTP Transport",
                desc: "Production-grade IPv4 email dispatch with timeout resiliency.",
              },
              {
                icon: Globe,
                title: "Custom Webhook Integrations",
                desc: "HTTP POST/PUT webhooks with variable payload template resolution.",
              },
              {
                icon: Clock,
                title: "Delay & Rate Controls",
                desc: "Configurable wait timers and rate-limit backoffs between step executions.",
              },
              {
                icon: ShieldCheck,
                title: "JWT & Session Security",
                desc: "Strict HTTP-only cookie auth, rate-limiting, and sanitized secrets.",
              },
              {
                icon: Activity,
                title: "Real-time Execution History",
                desc: "Inspect step durations, status badges, and terminal output logs.",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/[0.08] bg-dark-900/80 p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-brand-glow"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950/60 text-blue-400 border border-blue-500/30 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-[0_0_12px_-2px_rgba(59,130,246,0.3)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* 12. FAQ SECTION */}
      {/* ================================================= */}
      <section
        id="faq"
        ref={faqRef}
        className={`py-24 border-t border-white/[0.08] bg-dark-900/40 transition-all duration-700 ${
          faqInView ? "opacity-100 translate-y-0" : "opacity-90 translate-y-4"
        }`}
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Frequently Asked Questions</span>
            <h2 className="mt-1 text-3xl font-black text-white tracking-tight sm:text-4xl">
              Everything You Need to Know
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-card ${
                    isOpen
                      ? "border-blue-500/40 bg-dark-900/90 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                      : "border-white/[0.08] bg-dark-900/80 hover:border-white/[0.16]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-blue-400" : ""
                      }`}
                    />
                  </button>

                  <div className="faq-content" data-open={isOpen ? "true" : "false"}>
                    <div>
                      <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-white/[0.04] pt-3">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* 13. FINAL CTA */}
      {/* ================================================= */}
      <section
        ref={ctaRef}
        className={`py-24 border-t border-white/[0.08] bg-dark-950 transition-all duration-700 ${
          ctaInView ? "opacity-100 translate-y-0" : "opacity-90 translate-y-4"
        }`}
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-b from-dark-900 via-dark-850 to-dark-950 p-10 text-center shadow-brand-glow sm:p-14">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl pointer-events-none hero-glow-1" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none hero-glow-2" />

            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white sm:text-5xl tracking-tight leading-tight">
                Build your first workflow today.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm text-slate-300 leading-relaxed">
                Join FlowPilot to create, execute, and monitor intelligent workflows in minutes.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-xs font-bold text-white shadow-brand-glow transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-brand-glow-lg hover:scale-105 active:scale-[0.98] border border-blue-400/20"
                >
                  <span>Start Building — It&apos;s Free</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-dark-900 px-7 py-3.5 text-xs font-bold text-slate-200 transition-all duration-200 hover:bg-dark-800 hover:text-white hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <span>Existing User Login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* 14. FOOTER */}
      {/* ================================================= */}
      <footer className="border-t border-white/[0.08] bg-dark-950 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2.5 text-white font-extrabold text-sm group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-brand-glow group-hover:scale-105 transition-transform">
              <Workflow className="h-4 w-4" />
            </div>
            <span className="group-hover:text-blue-400 transition-colors">FlowPilot</span>
          </Link>

          <p className="text-xs text-slate-500 font-medium">
            &copy; 2026 FlowPilot Inc. Workflow Automation Engine. All rights reserved.
          </p>

          <div className="flex items-center gap-5 text-xs font-semibold text-slate-400">
            <Link href="/login" className="hover:text-blue-400 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-blue-400 transition-colors">Register</Link>
            <Link href="/dashboard/workflows" className="hover:text-blue-400 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}