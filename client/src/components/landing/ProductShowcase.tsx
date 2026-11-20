"use client";

import { useState } from "react";
import {
  Zap,
  Sparkles,
  Mail,
  Clock,
  Globe,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  ChevronRight,
  Cpu,
} from "lucide-react";

interface PipelineStep {
  stepNumber: number;
  type: "TRIGGER" | "AI" | "EMAIL" | "DELAY" | "WEBHOOK";
  name: string;
  subhead: string;
  icon: typeof Zap;
  color: string;
  badge: string;
  border: string;
  bg: string;
  inputPayload: Record<string, any>;
  promptOrTemplate?: string;
  outputPayload: Record<string, any>;
  durationMs: number;
  explanation: string;
}

const DEMO_PIPELINE: PipelineStep[] = [
  {
    stepNumber: 1,
    type: "TRIGGER",
    name: "Webhook Intake",
    subhead: "HTTP POST hr.event.signup",
    icon: Zap,
    color: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    border: "border-emerald-500/40",
    bg: "bg-emerald-950/30",
    inputPayload: {
      event: "hr.new_hire",
      candidate_name: "Marcus Vance",
      role: "Staff Platform Engineer",
      department: "Infrastructure",
      manager_email: "sarah.cto@flowpilot.io",
      hire_email: "marcus.v@flowpilot.io",
      start_date: "2026-12-01",
    },
    outputPayload: {
      status: "validated",
      intake_id: "intake_9801",
      received_at: "2026-11-20T10:00:00Z",
    },
    durationMs: 18,
    explanation:
      "Captures external HTTP payloads with schema validation, assigning a secure execution trace ID.",
  },
  {
    stepNumber: 2,
    type: "AI",
    name: "Gemini 2.5 Flash",
    subhead: "Cognitive Processing & Synthesis",
    icon: Sparkles,
    color: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    border: "border-purple-500/40",
    bg: "bg-purple-950/30",
    promptOrTemplate:
      "Role: HR Architect. Generate a high-clarity welcome message and 3-step day-one setup guide for {{trigger.candidate_name}}, who is joining as {{trigger.role}} in {{trigger.department}}.",
    inputPayload: {
      referenced_context: ["trigger.candidate_name", "trigger.role", "trigger.department"],
      temperature: 0.2,
      model: "gemini-2.5-flash",
    },
    outputPayload: {
      subject: "Welcome to Infrastructure, Marcus! Here is your Day 1 playbook",
      summary:
        "Welcome Marcus! As Staff Platform Engineer, your first day focuses on Kubernetes cluster access, pairing with Sarah, and reviewing our architecture RFCs.",
      checklist: [
        "Clone infrastructure repository & setup GPG signing",
        "Join #eng-infrastructure Slack channel",
        "Pairing session with Sarah at 2:00 PM UTC",
      ],
    },
    durationMs: 340,
    explanation:
      "Interpolates upstream trigger variables into prompts, querying Gemini to generate structured JSON without custom code.",
  },
  {
    stepNumber: 3,
    type: "EMAIL",
    name: "SMTP Dispatch",
    subhead: "Automated Executive Delivery",
    icon: Mail,
    color: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    border: "border-blue-500/40",
    bg: "bg-blue-950/30",
    promptOrTemplate: "To: {{trigger.hire_email}} | CC: {{trigger.manager_email}}",
    inputPayload: {
      to: "{{trigger.hire_email}}",
      cc: "{{trigger.manager_email}}",
      subject: "{{ai.subject}}",
      body: "{{ai.summary}}",
    },
    outputPayload: {
      delivered: true,
      smtp_response: "250 2.0.0 OK: queued as 40A812C",
      message_id: "msg_v88910a",
      timestamp: "2026-11-20T10:00:00.380Z",
    },
    durationMs: 72,
    explanation:
      "Renders dynamic variables into transactional emails, delivering via standard SMTP with verified headers.",
  },
  {
    stepNumber: 4,
    type: "DELAY",
    name: "Smart Delay",
    subhead: "15-Minute Queue Buffer",
    icon: Clock,
    color: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    border: "border-amber-500/40",
    bg: "bg-amber-950/30",
    inputPayload: {
      duration_seconds: 900,
      reason: "Allow new hire inbox provisioning before team announcements",
    },
    outputPayload: {
      timer_status: "elapsed",
      scheduled_for: "10:15:00 UTC",
      resumed_at: "10:15:00.012 UTC",
    },
    durationMs: 900,
    explanation:
      "Suspends execution state in persistent storage, awakening precisely at the scheduled timestamp.",
  },
  {
    stepNumber: 5,
    type: "WEBHOOK",
    name: "Outbound Webhook",
    subhead: "Target: Slack / HRIS API",
    icon: Globe,
    color: "text-rose-400",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    border: "border-rose-500/40",
    bg: "bg-rose-950/30",
    promptOrTemplate: "POST https://hooks.slack.com/services/T00/B00/X00",
    inputPayload: {
      channel: "#team-announcements",
      text: "🎉 Please welcome {{trigger.candidate_name}} to the {{trigger.department}} team!",
    },
    outputPayload: {
      http_status: 200,
      body: "ok",
      trace_id: "slack_resp_7721",
    },
    durationMs: 44,
    explanation:
      "Dispatches authenticated HTTP requests to third-party endpoints with upstream context payload interpolation.",
  },
];

export function ProductShowcase() {
  const [selectedStepIndex, setSelectedStepIndex] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const currentStep = DEMO_PIPELINE[selectedStepIndex];

  const handleSimulate = () => {
    setIsSimulating(true);
    let step = 0;
    setSelectedStepIndex(0);

    const interval = setInterval(() => {
      step++;
      if (step < DEMO_PIPELINE.length) {
        setSelectedStepIndex(step);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 850);
  };

  return (
    <section id="interactive-pipeline" className="relative py-20 bg-slate-950/60 border-t border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-3">
            <Cpu className="h-3.5 w-3.5" />
            <span>Interactive Execution Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            See how data flows between steps
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Every step inherits the full context of prior executions. Watch how an initial trigger payload
            is transformed by Gemini AI, emailed through SMTP, buffered, and pushed to external webhooks.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors border border-slate-700 shadow-sm"
            >
              {isSimulating ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Simulating Step {selectedStepIndex + 1} of 5...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-blue-400 fill-current" />
                  <span>Run Live Pipeline Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Interactive Container */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6 lg:p-8 backdrop-blur-md">
          {/* Step Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-6 border-b border-slate-800">
            {DEMO_PIPELINE.map((step, idx) => {
              const Icon = step.icon;
              const isCurrent = idx === selectedStepIndex;

              return (
                <button
                  key={step.name}
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                    isCurrent
                      ? `${step.border} ${step.bg} ring-1 ring-blue-500/40 shadow-sm`
                      : "border-slate-800/80 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${step.border} ${step.bg} ${step.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        0{step.stepNumber}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">
                        {step.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      {step.subhead}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Inspector for Selected Step */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left column: Overview & Configuration */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-mono font-semibold uppercase border ${currentStep.badge}`}
                  >
                    Step 0{currentStep.stepNumber} • {currentStep.type}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Latency: {currentStep.durationMs}ms
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{currentStep.name}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {currentStep.explanation}
                </p>

                {currentStep.promptOrTemplate && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                      Template / Endpoint
                    </div>
                    <div className="rounded bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-blue-300 break-words">
                      {currentStep.promptOrTemplate}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Cascade Explanation */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs text-slate-400 flex items-start gap-2.5">
                <ChevronRight className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Outputs from this step are saved under the identifier{" "}
                  <code className="text-blue-300 font-mono">
                    {currentStep.type.toLowerCase()}_step_{currentStep.stepNumber}
                  </code>{" "}
                  and become available to all subsequent steps.
                </span>
              </div>
            </div>

            {/* Right column: Raw Context and Execution Telemetry */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-blue-400" />
                    <span>State Telemetry Inspector</span>
                  </div>
                  <span className="text-[10px] text-slate-500">JSON Payload</span>
                </div>

                <div className="p-4 space-y-4 font-mono text-xs">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                      <span>Incoming Execution Parameters</span>
                      <span className="text-[10px] text-slate-500">Inputs</span>
                    </div>
                    <pre className="rounded-lg bg-slate-900/90 border border-slate-800/80 p-3 text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                      {JSON.stringify(currentStep.inputPayload, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-emerald-400 mb-1 flex items-center justify-between">
                      <span>Step Result / Emitted Context</span>
                      <span className="text-[10px] text-emerald-500/80">Returned Context</span>
                    </div>
                    <pre className="rounded-lg bg-slate-900/90 border border-slate-800/80 p-3 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
                      {JSON.stringify(currentStep.outputPayload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
