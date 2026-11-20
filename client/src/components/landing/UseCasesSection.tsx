"use client";

import {
  Users,
  Target,
  UserCheck,
  Zap,
  Sparkles,
  Mail,
  Clock,
  Globe,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export function UseCasesSection() {
  return (
    <section id="use-cases" className="relative py-24 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-[#E9F5F1] px-3.5 py-1 text-xs font-semibold text-[#0D9488] mb-3 font-mono">
            <span>Real-World Automation</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#17252F] leading-tight">
            How modern teams automate with FlowPilot
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4A5E6D]">
            From employee onboarding to inbound lead triage, see how FlowPilot connects your tools into
            resilient, automated operations.
          </p>
        </div>

        {/* Featured Case: Employee Onboarding Pipeline */}
        <div className="rounded-2xl border border-slate-200 bg-[#F8FAF8] p-6 sm:p-8 lg:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 6 cols: Scenario Context */}
            <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-mono font-medium text-[#0D9488] shadow-xs">
                  <Users className="h-3.5 w-3.5" />
                  <span>People Operations Playbook</span>
                </div>

                <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-[#17252F] tracking-tight">
                  Zero-Touch Day-One Employee Onboarding
                </h3>

                <p className="mt-3 text-sm sm:text-base text-[#4A5E6D] leading-relaxed">
                  When a new hire accepts an offer, FlowPilot coordinates the entire cross-departmental lifecycle:
                  generates customized onboarding schedules via Gemini, sends welcome guides, buffers for IT setup,
                  and provisions workspace accounts.
                </p>

                <div className="mt-6 space-y-3.5">
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                    <div className="text-xs font-mono uppercase text-rose-700 font-semibold mb-1">
                      The Manual Problem
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      HR managers spend 3+ hours per hire copy-pasting emails, creating calendar invites, and manually nudging IT for software credentials.
                    </p>
                  </div>

                  <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                    <div className="text-xs font-mono uppercase text-teal-800 font-semibold mb-1">
                      The FlowPilot Automation
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      A single HRIS webhook triggers Gemini AI to synthesize role requirements, dispatches personalized welcome instructions, and alerts team channels.
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[#17252F]">
                  <CheckCircle2 className="h-4 w-4 text-[#0D9488] shrink-0" />
                  <span>0 Manual emails</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#17252F]">
                  <CheckCircle2 className="h-4 w-4 text-[#0D9488] shrink-0" />
                  <span>100% IT Setup audit</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#17252F]">
                  <CheckCircle2 className="h-4 w-4 text-[#0D9488] shrink-0" />
                  <span>Custom Day 1 guide</span>
                </div>
              </div>
            </div>

            {/* Right 6 cols: Visual Pipeline Steps & Output */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="text-xs font-mono text-[#5C7280] uppercase tracking-wider mb-3 font-semibold flex items-center justify-between">
                  <span>Execution Sequence</span>
                  <span className="text-[#0D9488]">5 Steps Connected</span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-[#F8FAF8] border border-slate-200 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-[#0D9488]">01</span>
                      <Zap className="h-4 w-4 text-teal-600" />
                      <span className="text-[#17252F] font-semibold">HRIS Inbound Webhook</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">Trigger</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-[#F8FAF8] border border-slate-200 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-indigo-600">02</span>
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span className="text-[#17252F] font-semibold">Gemini Role Playbook Synthesis</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">AI Reasoning</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-[#F8FAF8] border border-slate-200 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sky-600">03</span>
                      <Mail className="h-4 w-4 text-sky-600" />
                      <span className="text-[#17252F] font-semibold">SMTP Welcome Packet Dispatch</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">Email</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-[#F8FAF8] border border-slate-200 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-amber-600">04</span>
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-[#17252F] font-semibold">Smart Delay (2-Hour IT Window)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">Timer</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-[#F8FAF8] border border-slate-200 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-rose-600">05</span>
                      <Globe className="h-4 w-4 text-rose-600" />
                      <span className="text-[#17252F] font-semibold">Workspace Provisioning Webhook</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">Webhook</span>
                  </div>
                </div>
              </div>

              {/* Sample output state */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs shadow-xs">
                <div className="text-[11px] text-[#5C7280] uppercase tracking-wider mb-2 font-semibold">
                  Sample Execution Output Payload
                </div>
                <pre className="rounded-lg bg-[#101C2C] p-3 text-teal-300 overflow-x-auto text-[11px] leading-relaxed">
{`{
  "candidate": "Elena Rostova",
  "role": "Frontend Architect",
  "playbook_generated": true,
  "credentials_dispatched": true,
  "workspace_synced": true,
  "status": "completed"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
