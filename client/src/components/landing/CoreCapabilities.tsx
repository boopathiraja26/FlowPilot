"use client";

import {
  Workflow,
  Sparkles,
  Zap,
  Mail,
  Globe,
  Activity,
  CheckCircle2,
  Lock,
  ArrowRight,
  Code2,
  Terminal,
} from "lucide-react";

export function CoreCapabilities() {
  return (
    <section id="features" className="relative py-24 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-3">
            <span>Built for Production</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Designed for engineers. Built for reliability.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            FlowPilot replaces fragile custom scripts and disjointed Zapier zaps with a deterministic,
            observable workflow engine designed for modern web applications.
          </p>
        </div>

        {/* Editorial Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Visual DAG Workflow Builder (Large Featured Column - 7 Cols) */}
          <div className="md:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-3">
                <Workflow className="h-4 w-4" />
                <span>01 / VISUAL PIPELINE ORCHESTRATION</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Deterministic Directed Acyclic Graphs (DAG)
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Connect triggers and steps on a structured canvas. Our execution engine validates step
                dependencies before execution, ensuring upstream parameters are resolved without race conditions.
              </p>
            </div>

            {/* Visual preview */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/90 p-4 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3 text-[11px] text-slate-400">
                <span>graph.validate(workflow_id)</span>
                <span className="text-emerald-400 font-semibold">DAG: VALID • 0 CYCLES</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded bg-slate-900 px-3 py-2 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-white font-semibold">1. Webhook Intake</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">Root node</span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-900 px-3 py-2 border border-slate-800 ml-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                    <span className="text-white font-semibold">2. Gemini 2.5 Flash</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">Depends on #1</span>
                </div>
                <div className="flex items-center justify-between rounded bg-slate-900 px-3 py-2 border border-slate-800 ml-8">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    <span className="text-white font-semibold">3. SMTP & Webhook Dispatch</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">Depends on #2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: AI-Powered Cognitive Processing (5 Cols) */}
          <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-3">
                <Sparkles className="h-4 w-4" />
                <span>02 / GEMINI 2.5 INTEGRATION</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Contextual AI Intelligence
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Seamlessly query Google Gemini models with runtime context interpolation. No separate API
                gateways or Python workers required.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/90 p-4 font-mono text-xs">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">
                Prompt Variable Resolution
              </div>
              <div className="rounded bg-slate-900/80 p-2.5 border border-slate-800 text-[11px] text-purple-300 leading-relaxed">
                &ldquo;Extract intent from <span className="text-white font-bold underline decoration-blue-500">{"{{trigger.body.message}}"}</span> and categorize into enterprise sales priority.&rdquo;
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Model: <code className="text-white">gemini-2.5-flash</code></span>
                <span className="text-emerald-400">P95: 380ms</span>
              </div>
            </div>
          </div>

          {/* Card 3: Instant Webhook Ingestion & Dispatch (4 Cols) */}
          <div className="md:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2">
                <Zap className="h-4 w-4" />
                <span>03 / INGESTION</span>
              </div>
              <h4 className="text-lg font-bold text-white">Instant Webhook Endpoints</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Generate production-ready webhook URLs with one click. Supports HMAC validation, payload size controls, and automated retries.
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-slate-950/90 border border-slate-800 p-3 font-mono text-[11px] text-slate-300">
              <span className="text-emerald-400 font-semibold">POST</span> /api/v1/wh/live_89a01
              <div className="mt-1 text-[10px] text-slate-500">200 OK • Ingested in 12ms</div>
            </div>
          </div>

          {/* Card 4: Enterprise SMTP Delivery (4 Cols) */}
          <div className="md:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
                <Mail className="h-4 w-4" />
                <span>04 / NOTIFICATIONS</span>
              </div>
              <h4 className="text-lg font-bold text-white">Enterprise SMTP Delivery</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Deliver dynamic emails using your own SMTP credentials or managed relays with SPF, DKIM, and TLS delivery confirmation.
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-slate-950/90 border border-slate-800 p-3 font-mono text-[11px] text-slate-300">
              <div className="text-blue-300 truncate">To: recipient@company.com</div>
              <div className="text-[10px] text-emerald-400 mt-1">250 SMTP OK: TLS 1.3 Verified</div>
            </div>
          </div>

          {/* Card 5: Step Observability & Error Isolation (4 Cols) */}
          <div className="md:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
                <Activity className="h-4 w-4" />
                <span>05 / OBSERVABILITY</span>
              </div>
              <h4 className="text-lg font-bold text-white">Granular Execution Telemetry</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Inspect raw input, step outputs, duration, and stack traces. If a step fails, context is preserved for replay and debugging.
              </p>
            </div>
            <div className="mt-4 rounded-lg bg-slate-950/90 border border-slate-800 p-3 font-mono text-[11px] text-slate-300">
              <div className="flex items-center justify-between text-slate-400">
                <span>Run #4902</span>
                <span className="text-emerald-400">100% Success</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Audit log retained for 30 days</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
