"use client";

import { useEffect, useState, useCallback } from "react";
import { Zap, Sparkles, Mail, Clock, Globe, ArrowRight, CheckCircle2 } from "lucide-react";

interface OpeningAnimationProps {
  onComplete: () => void;
  forcePlay?: boolean;
}

const NODES = [
  { id: "trigger", label: "Trigger", sub: "Incoming Webhook", icon: Zap, color: "text-teal-400", border: "border-teal-500/40", bg: "bg-teal-950/70" },
  { id: "ai", label: "Gemini AI", sub: "Context Extraction", icon: Sparkles, color: "text-indigo-400", border: "border-indigo-500/40", bg: "bg-indigo-950/70" },
  { id: "email", label: "SMTP Email", sub: "Personalized Dispatch", icon: Mail, color: "text-sky-400", border: "border-sky-500/40", bg: "bg-sky-950/70" },
  { id: "delay", label: "Smart Delay", sub: "15m Execution Buffer", icon: Clock, color: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-950/70" },
  { id: "webhook", label: "Outbound API", sub: "CRM & Slack Sync", icon: Globe, color: "text-rose-400", border: "border-rose-500/40", bg: "bg-rose-950/70" },
];

export function OpeningAnimation({ onComplete, forcePlay = false }: OpeningAnimationProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const finish = useCallback(() => {
    setIsFadingOut(true);
    try {
      sessionStorage.setItem("flowpilot_intro_seen_v3", "true");
    } catch {
      // ignore storage access issues
    }
    const timer = setTimeout(() => {
      onComplete();
    }, 300);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alreadySeen = !forcePlay && sessionStorage.getItem("flowpilot_intro_seen_v3") === "true";

    if (prefersReducedMotion || alreadySeen) {
      onComplete();
      return;
    }

    setHasStarted(true);

    const t1 = setTimeout(() => setActiveStep(1), 300);
    const t2 = setTimeout(() => setActiveStep(2), 600);
    const t3 = setTimeout(() => setActiveStep(3), 900);
    const t4 = setTimeout(() => setActiveStep(4), 1200);
    const tPulse = setTimeout(() => setPulseActive(true), 1500);
    const tEnd = setTimeout(() => {
      finish();
    }, 2000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        finish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tPulse);
      clearTimeout(tEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [forcePlay, onComplete, finish]);

  if (!hasStarted) {
    return null;
  }

  return (
    <div
      aria-label="FlowPilot Opening Sequence"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#101C2C] px-4 transition-opacity duration-300 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none" />

      {/* Skip button */}
      <button
        type="button"
        onClick={finish}
        className="absolute top-6 right-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
      >
        <span>Skip</span>
        <kbd className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">Esc</kbd>
      </button>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Brand mark */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs text-teal-300 shadow-sm font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="font-semibold">FlowPilot</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Sequential Execution Engine</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-8">
          From manual work to automated flow
        </h2>

        {/* Nodes connecting row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 w-full max-w-3xl">
          {NODES.map((node, idx) => {
            const isVisible = activeStep >= idx;
            const Icon = node.icon;
            const isCurrent = activeStep === idx;

            return (
              <div key={node.id} className="flex flex-col sm:flex-row items-center gap-2">
                {/* Node card */}
                <div
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 backdrop-blur-md transition-all duration-300 ${
                    isVisible
                      ? `${node.border} ${node.bg} scale-100 opacity-100 shadow-lg`
                      : "border-white/5 bg-white/[0.02] scale-95 opacity-25"
                  } ${isCurrent ? "ring-2 ring-teal-500/40" : ""} ${
                    pulseActive ? "ring-1 ring-teal-400/50" : ""
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${node.border} ${node.bg} ${node.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left min-w-[90px]">
                    <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                      {node.label}
                      {isVisible && <CheckCircle2 className="h-3 w-3 text-teal-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono leading-tight truncate">
                      {node.sub}
                    </div>
                  </div>
                </div>

                {/* Connecting arrow / line between nodes (hidden on last item) */}
                {idx < NODES.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center px-1">
                    <div className="relative h-0.5 w-6 sm:w-8 bg-white/10 overflow-hidden rounded-full">
                      <div
                        className={`absolute inset-0 bg-teal-400 transition-all duration-300 ${
                          activeStep > idx ? "w-full" : "w-0"
                        }`}
                      />
                    </div>
                    <ArrowRight
                      className={`h-3 w-3 transition-colors ${
                        activeStep > idx ? "text-teal-400" : "text-slate-600"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status text */}
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <span>
            {activeStep < 4
              ? `Connecting step ${activeStep + 1} of 5...`
              : pulseActive
              ? "Validating pipeline execution DAG..."
              : "Workflow pipeline established."}
          </span>
        </div>
      </div>
    </div>
  );
}
