"use client";

import {
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  RotateCcw,
  Layers,
} from "lucide-react";

interface ExecutionTrace {
  id: string;
  workflow: string;
  triggerSource: string;
  status: "COMPLETED" | "RUNNING" | "FAILED";
  duration: string;
  timestamp: string;
  stepsCount: number;
}

const RECENT_RUNS: ExecutionTrace[] = [
  {
    id: "run_9841",
    workflow: "Lead Enrichment & SDR Routing",
    triggerSource: "POST /webhook/inbound.lead",
    status: "COMPLETED",
    duration: "484ms",
    timestamp: "Just now",
    stepsCount: 5,
  },
  {
    id: "run_9840",
    workflow: "Employee Onboarding Orchestrator",
    triggerSource: "hr.candidate.hired",
    status: "COMPLETED",
    duration: "1.2s",
    timestamp: "2 mins ago",
    stepsCount: 5,
  },
  {
    id: "run_9839",
    workflow: "Customer Activation Drip",
    triggerSource: "auth.user.signup",
    status: "RUNNING",
    duration: "in progress",
    timestamp: "5 mins ago",
    stepsCount: 4,
  },
  {
    id: "run_9838",
    workflow: "CRM Account Sync",
    triggerSource: "POST /api/v1/sync",
    status: "COMPLETED",
    duration: "310ms",
    timestamp: "12 mins ago",
    stepsCount: 3,
  },
];

export function ReliabilitySection() {
  return (
    <section id="reliability" className="relative py-24 bg-slate-950/70 border-t border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Telemetry & Reliability</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Total visibility into every execution
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Never wonder whether a webhook fired, an AI response completed, or an email landed. FlowPilot
            provides full audit trails and deterministic step isolation.
          </p>
        </div>

        {/* Live Execution Monitoring Table Mockup */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden mb-16 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4 gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Live Execution Telemetry</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-400">
                Audit Stream
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Engine: Active</span>
              </span>
              <span>Failure Rate: 0.00%</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-500 uppercase tracking-wider border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Run ID</th>
                  <th className="px-6 py-3 font-semibold">Workflow</th>
                  <th className="px-6 py-3 font-semibold">Trigger Source</th>
                  <th className="px-6 py-3 font-semibold">Steps</th>
                  <th className="px-6 py-3 font-semibold">Duration</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {RECENT_RUNS.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-6 py-3.5 text-blue-400 font-semibold">{run.id}</td>
                    <td className="px-6 py-3.5 text-white font-sans font-medium">{run.workflow}</td>
                    <td className="px-6 py-3.5 text-slate-400 truncate max-w-[200px]">
                      {run.triggerSource}
                    </td>
                    <td className="px-6 py-3.5">{run.stepsCount} nodes</td>
                    <td className="px-6 py-3.5">{run.duration}</td>
                    <td className="px-6 py-3.5">
                      {run.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400 border border-emerald-500/20 font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          SUCCESS
                        </span>
                      )}
                      {run.status === "RUNNING" && (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-400 border border-blue-500/20 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                          RUNNING
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{run.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Roadmap & Availability Transparency Matrix */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Platform Capability Status</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              We believe in engineering transparency. Here is our exact availability matrix:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live & Verified */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                <CheckCircle2 className="h-4 w-4" />
                <span>Currently Live & Verified</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Visual Drag-and-Drop Workflow Canvas with ReactFlow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Google Gemini 2.5 AI step with prompt variable substitution</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Automated SMTP email dispatch with dynamic HTML templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Inbound Webhook triggers & Outbound REST API webhooks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Configurable delay timers with persistent scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Step-by-step execution history and error logs</span>
                </li>
              </ul>
            </div>

            {/* In Active Development */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-5">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider mb-3">
                <Clock className="h-4 w-4" />
                <span>In Active Development & Roadmap</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>Multi-tenant team workspaces and granular RBAC permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>Conditional branching logic (if/else DAG branching)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>Distributed cron cluster for recurring time-based automations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>Pre-built native connectors (Google Drive, Slack OAuth, Stripe)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
