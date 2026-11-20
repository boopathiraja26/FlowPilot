"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Zap,
  Sparkles,
  Mail,
  Clock,
  Globe,
  CheckCircle2,
  CircleDot,
  Loader2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Layers,
  Activity,
  SlidersHorizontal,
} from "lucide-react";

type Scene = "build" | "automate" | "monitor";

const SCENES: { id: Scene; index: number; label: string; headline: string; copy: string }[] = [
  {
    id: "build",
    index: 0,
    label: "BUILD",
    headline: "Design it visually.",
    copy: "Build multi-step automations by connecting the steps your business needs. No brittle scripts, no server management.",
  },
  {
    id: "automate",
    index: 1,
    label: "AUTOMATE",
    headline: "Let the workflow handle the work.",
    copy: "Automatically move information between steps and services. Seamlessly blend Gemini AI with email delivery and webhooks.",
  },
  {
    id: "monitor",
    index: 2,
    label: "MONITOR",
    headline: "Know what happened.",
    copy: "Inspect every execution with transparent status and step-level input/output results. No mystery failures.",
  },
];

// ─────────────────────────────────────────────────────────────
// BUILD SCENE
// ─────────────────────────────────────────────────────────────

const BUILD_NODES = [
  { id: "trigger", type: "TRIGGER", label: "Form Submission", color: "teal", tag: "Inbound Hook" },
  { id: "ai", type: "AI", label: "Gemini AI Analysis", color: "indigo", tag: "AI Reasoning" },
  { id: "email", type: "EMAIL", label: "Personalized Email", color: "sky", tag: "SMTP Relay" },
  { id: "delay", type: "DELAY", label: "15-Min Buffer", color: "amber", tag: "Timer" },
  { id: "webhook", type: "WEBHOOK", label: "Sync to CRM", color: "rose", tag: "Outbound Hook" },
];

const COLOR_MAP: Record<string, { badge: string; border: string; icon: string; ring: string }> = {
  teal: {
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/25",
    border: "border-teal-500/40",
    icon: "text-teal-400",
    ring: "ring-teal-500/40",
  },
  indigo: {
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
    border: "border-indigo-500/40",
    icon: "text-indigo-400",
    ring: "ring-indigo-500/40",
  },
  sky: {
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    border: "border-sky-500/40",
    icon: "text-sky-400",
    ring: "ring-sky-500/40",
  },
  amber: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    border: "border-amber-500/40",
    icon: "text-amber-400",
    ring: "ring-amber-500/40",
  },
  rose: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/25",
    border: "border-rose-500/40",
    icon: "text-rose-400",
    ring: "ring-rose-500/40",
  },
};

const NODE_ICONS: Record<string, typeof Zap> = {
  TRIGGER: Zap,
  AI: Sparkles,
  EMAIL: Mail,
  DELAY: Clock,
  WEBHOOK: Globe,
};

function BuildScene() {
  const [selected, setSelected] = useState("ai");
  const selectedNode = BUILD_NODES.find((n) => n.id === selected) ?? BUILD_NODES[1];
  const c = COLOR_MAP[selectedNode.color];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0C1829] shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Window Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0D1F36]/80 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          </div>
          <span className="text-slate-600 text-xs hidden sm:inline">|</span>
          <span className="text-xs text-slate-300 font-medium truncate">
            Visual Canvas: Lead Intake & Qualification
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-[10px] font-mono text-teal-300">
            DAG Mode
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="text-[11px] font-mono uppercase text-slate-400 mb-3 tracking-wider flex items-center justify-between">
          <span>Click a node to inspect its runtime payload</span>
          <span className="text-teal-400">Step 0{BUILD_NODES.findIndex(n => n.id === selected) + 1} of 05</span>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
          {BUILD_NODES.map((node) => {
            const Icon = NODE_ICONS[node.type];
            const c2 = COLOR_MAP[node.color];
            const isSelected = node.id === selected;

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelected(node.id)}
                className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? `${c2.border} bg-white/10 ring-1 ${c2.ring} shadow-lg scale-[1.02]`
                    : "border-white/10 bg-white/[0.03] hover:bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border ${c2.border} bg-white/5 ${c2.icon}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold uppercase border rounded px-1.5 py-0.5 ${c2.badge}`}
                  >
                    {node.type}
                  </span>
                </div>
                <div className="min-w-0 w-full mt-1">
                  <div className="text-xs text-white font-semibold truncate">{node.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{node.tag}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Inspector Panel */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 mb-3 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-teal-400" />
              <span className="font-semibold text-white">{selectedNode.label}</span>
              <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${c.badge}`}>
                {selectedNode.type}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Live Config</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-black/50 border border-white/5 p-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">
                Context Input Template
              </div>
              <pre className="text-slate-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {selectedNode.type === "TRIGGER" && 'POST /api/v1/inbound\n{\n  "email": "{{contact.email}}",\n  "company": "{{contact.company}}"\n}'}
                {selectedNode.type === "AI" && 'Model: gemini-2.5-flash\nPrompt: "Summarize company intent and classify priority for {{trigger.email}}"'}
                {selectedNode.type === "EMAIL" && 'To: {{trigger.email}}\nSubject: "Welcome to FlowPilot"\nTemplate: "starter_guide.html"'}
                {selectedNode.type === "DELAY" && 'Wait Duration: 900 seconds (15 minutes)\nResume Strategy: exact_timestamp'}
                {selectedNode.type === "WEBHOOK" && 'POST https://api.crm.internal/v2/contacts\nPayload: {"score": {{ai.intent_score}}}'}
              </pre>
            </div>

            <div className="rounded-lg bg-black/50 border border-white/5 p-3">
              <div className="text-[10px] text-teal-400 uppercase tracking-wider mb-1.5 font-semibold">
                Output State Cascade
              </div>
              <pre className="text-teal-200 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {selectedNode.type === "TRIGGER" && 'HTTP 200 OK\n{\n  "status": "accepted",\n  "context_id": "ctx_9941a"\n}'}
                {selectedNode.type === "AI" && '{\n  "intent": "Workflow Automation",\n  "tier": "growth",\n  "intent_score": 0.94\n}'}
                {selectedNode.type === "EMAIL" && '{\n  "messageId": "msg_004812",\n  "delivered": true,\n  "accepted": ["user@example.com"]\n}'}
                {selectedNode.type === "DELAY" && '{\n  "status": "resumed",\n  "duration_elapsed": "15m 00s"\n}'}
                {selectedNode.type === "WEBHOOK" && 'HTTP 200 OK\n{\n  "record_id": "rec_7741",\n  "synced": true\n}'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTOMATE SCENE
// ─────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { id: "trigger", type: "TRIGGER", label: "Form Submission", icon: Zap, color: "teal", duration: "12ms" },
  { id: "ai", type: "AI", label: "Gemini AI Analysis", icon: Sparkles, color: "indigo", duration: "340ms" },
  { id: "email", type: "EMAIL", label: "Personalized Email", icon: Mail, color: "sky", duration: "85ms" },
  { id: "delay", type: "DELAY", label: "15-Min Buffer", icon: Clock, color: "amber", duration: "15m 00s" },
  { id: "webhook", type: "WEBHOOK", label: "Sync to CRM", icon: Globe, color: "rose", duration: "48ms" },
];

type ExecStatus = "idle" | "running" | "done";

function AutomateScene() {
  const [activeStep, setActiveStep] = useState(-1);
  const [stepStatus, setStepStatus] = useState<ExecStatus[]>(Array(5).fill("idle"));
  const [running, setRunning] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  const runSimulation = useCallback(() => {
    clearAllTimeouts();
    setRunning(true);
    setActiveStep(-1);
    setStepStatus(Array(5).fill("idle"));

    const delays = [0, 1100, 2200, 3200, 4100];

    delays.forEach((delay, i) => {
      const t1 = setTimeout(() => {
        setActiveStep(i);
        setStepStatus((prev) => {
          const next = [...prev];
          for (let j = 0; j < i; j++) next[j] = "done";
          next[i] = "running";
          return next;
        });

        const t2 = setTimeout(() => {
          setStepStatus((prev) => {
            const next = [...prev];
            next[i] = "done";
            return next;
          });

          if (i === 4) {
            setActiveStep(-1);
            setRunning(false);
          }
        }, 800);
        timeoutsRef.current.push(t2);
      }, delay);
      timeoutsRef.current.push(t1);
    });
  }, [clearAllTimeouts]);

  useEffect(() => {
    const t = setTimeout(runSimulation, 600);
    timeoutsRef.current.push(t);
    return () => {
      clearAllTimeouts();
    };
  }, [runSimulation, clearAllTimeouts]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0C1829] shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0D1F36]/80 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          </div>
          <span className="text-slate-600 text-xs hidden sm:inline">|</span>
          <span className="text-xs text-slate-300 font-medium">Sequential Execution Engine</span>
        </div>
        <div className="flex items-center gap-2">
          {running ? (
            <span className="flex items-center gap-1.5 rounded bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 text-[10px] font-mono text-teal-300">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running Demo
            </span>
          ) : stepStatus[4] === "done" ? (
            <span className="flex items-center gap-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Success (485ms)
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-500">Ready</span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-2.5">
        <div className="text-[11px] font-mono uppercase text-slate-400 mb-2 tracking-wider flex items-center justify-between">
          <span>Sequential execution pipeline</span>
          <span className="text-slate-500 text-[10px]">Demo simulation</span>
        </div>

        {PIPELINE_STEPS.map((step, i) => {
          const Icon = step.icon;
          const c = COLOR_MAP[step.color];
          const status = stepStatus[i];
          const isActive = activeStep === i;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 ${
                isActive
                  ? `${c.border} bg-white/10 shadow-lg ring-1 ${c.ring}`
                  : status === "done"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              {/* Step Status Indicator */}
              <div className="shrink-0 w-6 flex justify-center">
                {status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {status === "running" && <Loader2 className="h-4 w-4 text-teal-400 animate-spin" />}
                {status === "idle" && <CircleDot className="h-4 w-4 text-slate-600" />}
              </div>

              {/* Step Icon */}
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg border ${c.border} bg-white/5 ${c.icon} shrink-0`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Step Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-bold uppercase border rounded px-1.5 py-0.5 ${c.badge}`}>
                    {step.type}
                  </span>
                  <span className="text-xs text-white font-semibold truncate">{step.label}</span>
                </div>
              </div>

              {/* Timing / Status output */}
              <div className="shrink-0 text-right font-mono text-[11px]">
                {isActive && (
                  <span className="text-teal-400 animate-pulse font-medium">Processing...</span>
                )}
                {status === "done" && (
                  <span className="text-emerald-400 font-semibold">{step.duration}</span>
                )}
                {status === "idle" && <span className="text-slate-600">Pending</span>}
              </div>
            </div>
          );
        })}

        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={runSimulation}
            disabled={running}
            className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 hover:border-teal-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-mono inline-flex items-center gap-1.5"
          >
            {running ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Executing Pipeline...
              </>
            ) : (
              <>
                <span>▶ Run Simulation</span>
              </>
            )}
          </button>
          <span className="text-[11px] font-mono text-slate-500">Auto-triggers on intake</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MONITOR SCENE
// ─────────────────────────────────────────────────────────────

const EXECUTION_LOG = [
  { id: "exec_49102", trigger: "Form Intake", status: "success", steps: "5/5", duration: "485ms", time: "Just now" },
  { id: "exec_49101", trigger: "Stripe Webhook", status: "success", steps: "5/5", duration: "520ms", time: "3m ago" },
  { id: "exec_49100", trigger: "Manual Test", status: "failed", steps: "3/5", duration: "210ms", time: "14m ago" },
  { id: "exec_49099", trigger: "Form Intake", status: "success", steps: "5/5", duration: "472ms", time: "1h ago" },
];

function MonitorScene() {
  const [expanded, setExpanded] = useState<string | null>("exec_49100");

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0C1829] shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0D1F36]/80 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          </div>
          <span className="text-slate-600 text-xs hidden sm:inline">|</span>
          <span className="text-xs text-slate-300 font-medium">Execution Telemetry & Audit Logs</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Sample Records</span>
      </div>

      <div className="p-4 sm:p-6">
        <div className="text-[11px] font-mono uppercase text-slate-400 mb-3 tracking-wider flex items-center justify-between">
          <span>Click any run to view step-by-step trace</span>
          <span className="text-emerald-400">99.4% Success Rate</span>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase text-slate-500 pb-2 border-b border-white/10 px-2 font-semibold">
          <div className="col-span-4">Execution ID</div>
          <div className="col-span-3">Trigger</div>
          <div className="col-span-2 text-center">Steps</div>
          <div className="col-span-3 text-right">Status</div>
        </div>

        {/* Execution Items */}
        <div className="divide-y divide-white/5">
          {EXECUTION_LOG.map((exec) => {
            const isExpanded = expanded === exec.id;

            return (
              <div key={exec.id} className="py-2">
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : exec.id)}
                  className={`w-full grid grid-cols-12 gap-2 items-center text-left py-2 px-2 rounded-lg transition-all ${
                    isExpanded ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="col-span-4 min-w-0">
                    <span className="font-mono text-xs font-semibold text-white block truncate">{exec.id}</span>
                    <span className="text-[10px] font-mono text-slate-500">{exec.time}</span>
                  </div>
                  <div className="col-span-3 text-xs text-slate-300 truncate">{exec.trigger}</div>
                  <div className="col-span-2 text-center font-mono text-xs text-slate-400">{exec.steps}</div>
                  <div className="col-span-3 flex justify-end">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                        exec.status === "success"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {exec.status === "success" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{exec.duration}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          <span>Failed</span>
                        </>
                      )}
                    </span>
                  </div>
                </button>

                {/* Expanded Trace Drawer */}
                {isExpanded && (
                  <div className="mt-2 mx-1 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] space-y-2">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                      Step Trace Breakdown:
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          1. Form Submission (Trigger)
                        </span>
                        <span className="text-slate-500">14ms · OK</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          2. Gemini AI Analysis
                        </span>
                        <span className="text-slate-500">320ms · OK</span>
                      </div>
                      {exec.status === "failed" ? (
                        <div className="flex items-center justify-between text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded p-1.5">
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="h-3 w-3 text-rose-400" />
                            3. SMTP Dispatch (Failed)
                          </span>
                          <span className="text-rose-300">Connection refused</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              3. SMTP Dispatch
                            </span>
                            <span className="text-slate-500">85ms · OK</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              4. Smart Delay (15 min)
                            </span>
                            <span className="text-slate-500">Timed resume · OK</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              5. CRM Webhook Sync
                            </span>
                            <span className="text-slate-500">48ms · OK</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN HORIZONTAL SCROLL SHOWCASE (DESKTOP) & STACK (MOBILE)
// ─────────────────────────────────────────────────────────────

export function ScrollShowcase() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const handleScroll = useCallback(() => {
    if (prefersReduced.current) return;
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const sectionTop = rect.top;
    const totalScrollableDistance = rect.height - window.innerHeight;

    if (totalScrollableDistance <= 0) return;

    // Calculate normalized progress between 0 and 1
    const rawProgress = -sectionTop / totalScrollableDistance;
    const clampedProgress = Math.max(0, Math.min(1, rawProgress));

    setScrollProgress(clampedProgress);

    // Sync active scene index for navigation controls
    if (clampedProgress < 0.33) {
      setActiveSceneIndex(0);
    } else if (clampedProgress < 0.67) {
      setActiveSceneIndex(1);
    } else {
      setActiveSceneIndex(2);
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [handleScroll]);

  const scrollToScene = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const sectionStart = rect.top + scrollTop;
    const totalScrollableDistance = rect.height - window.innerHeight;

    // Position target based on scene index (0, 0.5, 1.0)
    const targetProgress = index === 0 ? 0.05 : index === 1 ? 0.5 : 0.95;
    const targetScrollY = sectionStart + totalScrollableDistance * targetProgress;

    window.scrollTo({
      top: targetScrollY,
      behavior: "smooth",
    });
  };

  // Continuous horizontal translation: 3 panels total, so 0% to -66.666%
  const translateXPercent = -(scrollProgress * 200 / 3);

  return (
    <section
      id="workflow-showcase"
      ref={sectionRef}
      className="relative bg-[#101C2C] text-white"
    >
      {/* ─────────────────────────────────────────────────────────────
          DESKTOP: TRUE PINNED HORIZONTAL SCROLL STORYTELLING
          Height = 350vh for smooth travel across 3 scenes
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:block relative" style={{ height: "350vh" }}>
        <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden bg-[#101C2C]">
          {/* Subtle technical background grid */}
          <div className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none" />

          {/* Top Bar inside Sticky Showcase */}
          <div className="relative z-20 mx-auto max-w-7xl w-full px-8 pt-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400">
                Interactive Platform Tour
              </span>
            </div>

            {/* Interactive Scene Switcher / Progress Indicators */}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
              {SCENES.map((scene, idx) => {
                const isActive = activeSceneIndex === idx;

                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => scrollToScene(idx)}
                    className={`rounded-full px-4 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider transition-all duration-300 ${
                      isActive
                        ? "bg-teal-500 text-white shadow-sm ring-1 ring-teal-400"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    0{idx + 1} {scene.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-mono text-slate-500">
              Scroll down to travel
            </div>
          </div>

          {/* Continuous Sliding Horizontal Track */}
          <div className="relative z-10 flex-1 flex items-center overflow-hidden">
            <div
              ref={trackRef}
              className="flex w-[300vw] will-change-transform transition-transform duration-75 ease-out"
              style={{
                transform: `translate3d(${translateXPercent}%, 0, 0)`,
              }}
            >
              {/* SCENE 1: BUILD */}
              <div className="w-[100vw] shrink-0 px-8 lg:px-16 flex items-center">
                <div className="mx-auto max-w-7xl w-full grid grid-cols-12 gap-12 items-center">
                  <div className="col-span-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300 mb-6 font-mono">
                      <span>STEP 01 — BUILD</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                      {SCENES[0].headline}
                    </h2>
                    <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
                      {SCENES[0].copy}
                    </p>
                    <div className="mt-8 flex items-center gap-4 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-teal-400" />
                        <span>Visual drag-and-drop</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-teal-400" />
                        <span>Dynamic variables</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-7">
                    <BuildScene />
                  </div>
                </div>
              </div>

              {/* SCENE 2: AUTOMATE */}
              <div className="w-[100vw] shrink-0 px-8 lg:px-16 flex items-center">
                <div className="mx-auto max-w-7xl w-full grid grid-cols-12 gap-12 items-center">
                  <div className="col-span-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-6 font-mono">
                      <span>STEP 02 — AUTOMATE</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                      {SCENES[1].headline}
                    </h2>
                    <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
                      {SCENES[1].copy}
                    </p>
                    <div className="mt-8 flex items-center gap-4 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                        <span>Gemini AI step resolution</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                        <span>Zero server overhead</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-7">
                    <AutomateScene />
                  </div>
                </div>
              </div>

              {/* SCENE 3: MONITOR */}
              <div className="w-[100vw] shrink-0 px-8 lg:px-16 flex items-center">
                <div className="mx-auto max-w-7xl w-full grid grid-cols-12 gap-12 items-center">
                  <div className="col-span-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold text-sky-300 mb-6 font-mono">
                      <span>STEP 03 — MONITOR</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                      {SCENES[2].headline}
                    </h2>
                    <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
                      {SCENES[2].copy}
                    </p>
                    <div className="mt-8 flex items-center gap-4 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-sky-400" />
                        <span>Step-level telemetry</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-sky-400" />
                        <span>Complete execution audits</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-7">
                    <MonitorScene />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Overall Progress Line */}
          <div className="relative z-20 mx-auto max-w-7xl w-full px-8 pb-8">
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div
                className="bg-teal-400 h-full rounded-full transition-all duration-100 ease-out"
                style={{ width: `${Math.max(4, scrollProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE & TABLET: NATURAL VERTICAL STORYTELLING STACK
         ───────────────────────────────────────────────────────────── */}
      <div className="lg:hidden py-16 px-4 sm:px-6 divide-y divide-white/10 space-y-16">
        {/* MOBILE SCENE 1 */}
        <div className="space-y-6 pt-6 first:pt-0">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 text-xs font-semibold text-teal-300 mb-4 font-mono">
              <span>01 / BUILD</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {SCENES[0].headline}
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {SCENES[0].copy}
            </p>
          </div>
          <BuildScene />
        </div>

        {/* MOBILE SCENE 2 */}
        <div className="space-y-6 pt-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-0.5 text-xs font-semibold text-indigo-300 mb-4 font-mono">
              <span>02 / AUTOMATE</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {SCENES[1].headline}
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {SCENES[1].copy}
            </p>
          </div>
          <AutomateScene />
        </div>

        {/* MOBILE SCENE 3 */}
        <div className="space-y-6 pt-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-0.5 text-xs font-semibold text-sky-300 mb-4 font-mono">
              <span>03 / MONITOR</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {SCENES[2].headline}
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {SCENES[2].copy}
            </p>
          </div>
          <MonitorScene />
        </div>
      </div>
    </section>
  );
}
