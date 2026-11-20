"use client";

import { Workflow, Sliders, Play, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    step: "01",
    title: "Build your workflow",
    subtitle: "Visual DAG Canvas",
    description:
      "Start from scratch or a template. Add trigger nodes, Gemini AI reasoning, automated SMTP emails, delay buffers, and outbound webhooks with drag-and-drop ease.",
    icon: Workflow,
    metric: "Under 2 minutes to create",
  },
  {
    step: "02",
    title: "Configure triggers and actions",
    subtitle: "Context & Template Variables",
    description:
      "Bind parameters using simple handlebars notation like {{trigger.email}} or {{ai.summary}}. FlowPilot dynamically maps upstream step outputs at runtime.",
    icon: Sliders,
    metric: "Zero brittle glue code",
  },
  {
    step: "03",
    title: "Activate automation",
    subtitle: "Instant Webhook & API URL",
    description:
      "Turn on the workflow switch. Your unique endpoint is immediately provisioned, complete with schema validation, rate limits, and test runner tools.",
    icon: Play,
    metric: "Instant deployment",
  },
  {
    step: "04",
    title: "Monitor results",
    subtitle: "Live Telemetry & Audit Logs",
    description:
      "Inspect execution traces as they occur. View real-time status, execution latency per node, payload history, and granular failure reports.",
    icon: Activity,
    metric: "Real-time execution traces",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 bg-slate-950/80 border-t border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-3">
            <span>Execution Lifecycle</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            How FlowPilot works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Four disciplined steps from manual operational chaos to deterministic, observable automation.
          </p>
        </div>

        {/* 4-Step Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm transition-all hover:border-slate-700 hover:bg-slate-900/60"
              >
                <div>
                  {/* Step numbering & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-slate-600">
                      {item.step}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-blue-400">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-400 mb-1">
                    {item.subtitle}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>{item.metric}</span>
                  {idx < STEPS.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 hidden lg:block" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 font-mono transition-colors"
          >
            <span>Explore pre-built automation templates</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
