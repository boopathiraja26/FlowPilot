"use client";

import {
  Workflow,
  Sparkles,
  Zap,
  Mail,
  Clock,
  Globe,
  Check,
} from "lucide-react";

export function CoreCapabilities() {
  return (
    <section id="features" className="relative py-24 bg-[#F8FAF8] border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-[#E9F5F1] px-3.5 py-1 text-xs font-semibold text-[#0D9488] mb-3 font-mono">
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#17252F] leading-tight">
            Everything you need to orchestrate complex flows
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4A5E6D]">
            FlowPilot combines visual workflow design with AI intelligence and reliable delivery tools.
            Build multi-step automations without managing servers or writing brittle scripts.
          </p>
        </div>

        {/* Editorial Feature Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Feature 1: Large Featured Block (7 Cols) - Visual Workflow Canvas */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-7 sm:p-10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#0D9488] mb-3 uppercase tracking-wider">
                <Workflow className="h-4 w-4" />
                <span>01 / VISUAL BUILDER</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#17252F] tracking-tight">
                Visual Workflow Designer
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[#4A5E6D] leading-relaxed">
                Assemble multi-step workflows on an intuitive canvas. Order your steps sequentially,
                configure dynamic variable templates, and inspect individual stages directly in your browser.
              </p>
            </div>

            {/* Visual Representation */}
            <div className="mt-8 rounded-xl border border-slate-200 bg-[#F8FAF8] p-5 font-mono text-xs text-[#17252F]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3 text-[11px] text-[#5C7280]">
                <span>Pipeline Hierarchy</span>
                <span className="text-[#0D9488] font-semibold">Sequential Order</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    <span className="font-semibold text-[#17252F]">1. Webhook Intake</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Triggers workflow</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-xs ml-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="font-semibold text-[#17252F]">2. Gemini AI Reasoning</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Synthesizes input</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-xs ml-8">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <span className="font-semibold text-[#17252F]">3. SMTP & Webhook Dispatch</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Executes actions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: AI Cognitive Step (5 Cols) - Midnight Navy Contrast Section */}
          <div className="lg:col-span-5 rounded-2xl border border-[#163A46] bg-[#101C2C] p-7 sm:p-10 shadow-lg flex flex-col justify-between text-white">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-teal-400 mb-3 uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>02 / GEMINI AI</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Contextual AI Intelligence
              </h3>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                Inject intelligence into repetitive tasks. Leverage Google Gemini models to extract structured
                data, summarize intake forms, and write tailored emails based on runtime variables.
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs">
              <div className="text-[11px] text-teal-300 uppercase tracking-wider mb-2 font-semibold">
                Template Variable Resolution
              </div>
              <div className="rounded bg-black/40 p-3 border border-white/5 text-slate-200 text-xs leading-relaxed">
                &ldquo;Categorize customer inquiry from <span className="text-teal-300 font-semibold underline">{"{{trigger.email}}"}</span> and generate tailored follow-up recommendations.&rdquo;
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Model: <strong>gemini-2.5-flash</strong></span>
                <span className="text-teal-400 font-semibold">Direct API Integration</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Supporting Capabilities Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card A: Webhook Triggers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E9F5F1] text-[#0D9488] mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-[#17252F]">Instant Webhooks</h4>
              <p className="mt-2 text-xs text-[#4A5E6D] leading-relaxed">
                Generate secure webhook endpoints with one click. Ingest payloads from forms, Stripe,
                GitHub, or custom applications.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] font-mono text-[#0D9488] font-semibold">
              POST /api/v1/inbound
            </div>
          </div>

          {/* Card B: SMTP Email Relay */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600 mb-4">
                <Mail className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-[#17252F]">Automated Email Delivery</h4>
              <p className="mt-2 text-xs text-[#4A5E6D] leading-relaxed">
                Connect your SMTP settings to deliver dynamic personalized messages using variables
                from previous workflow steps.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] font-mono text-sky-600 font-semibold">
              Standard SMTP Relay
            </div>
          </div>

          {/* Card C: Delay Timers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-[#17252F]">Smart Delay Buffers</h4>
              <p className="mt-2 text-xs text-[#4A5E6D] leading-relaxed">
                Pause workflow execution for minutes or hours. Build natural breathing room between
                intake, processing, and external notifications.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] font-mono text-amber-600 font-semibold">
              Configurable Wait Windows
            </div>
          </div>

          {/* Card D: Outbound Webhooks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 mb-4">
                <Globe className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-[#17252F]">Outbound Integrations</h4>
              <p className="mt-2 text-xs text-[#4A5E6D] leading-relaxed">
                Send data to any external REST API, Slack webhook, or internal microservice with custom
                JSON payloads and headers.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] font-mono text-rose-600 font-semibold">
              HTTP POST / PUT / PATCH
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
