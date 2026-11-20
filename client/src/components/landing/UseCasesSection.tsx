"use client";

import { useState } from "react";
import {
  Users,
  Target,
  UserCheck,
  BellRing,
  ArrowRight,
  Zap,
  Sparkles,
  Mail,
  Clock,
  Globe,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface UseCase {
  id: string;
  tabTitle: string;
  badge: string;
  icon: typeof Users;
  title: string;
  problem: string;
  solution: string;
  pipeline: Array<{
    type: "TRIGGER" | "AI" | "EMAIL" | "DELAY" | "WEBHOOK";
    label: string;
    detail: string;
    icon: typeof Zap;
  }>;
  payloadPreview: string;
  metrics: string[];
}

const USE_CASES: UseCase[] = [
  {
    id: "lead-processing",
    tabTitle: "Lead Processing & Routing",
    badge: "Revenue & Sales Operations",
    icon: Target,
    title: "Instant Inbound Qualification & Executive SDR Routing",
    problem:
      "Leads sit in CRM inboxes for hours before manual review, causing inbound conversion rates to plummet.",
    solution:
      "FlowPilot triggers on lead submission, queries Gemini to score customer intent & company domain, fires a personalized welcome email, and dispatches high-priority Slack notifications to the appropriate account rep.",
    pipeline: [
      { type: "TRIGGER", label: "Form Submission", detail: "POST /lead.new", icon: Zap },
      { type: "AI", label: "Gemini 2.5 Flash", detail: "Intent & Tier Scoring", icon: Sparkles },
      { type: "EMAIL", label: "SMTP Dispatch", detail: "Executive Introduction", icon: Mail },
      { type: "WEBHOOK", label: "Salesforce / Slack", detail: "Real-time rep routing", icon: Globe },
    ],
    payloadPreview: `{
  "lead_email": "cto@fintech-scaleup.io",
  "ai_intent_tier": "Enterprise Tier 1",
  "intent_score": 0.96,
  "assigned_rep": "david.enterprise@flowpilot.io",
  "dispatched_at": "11:02:14 UTC"
}`,
    metrics: ["< 450ms Total Run Time", "3.2x Faster Rep Response", "100% Inbound Auditability"],
  },
  {
    id: "employee-onboarding",
    tabTitle: "Employee Onboarding",
    badge: "People & HR Operations",
    icon: Users,
    title: "Zero-Touch Day-One Provisioning & Welcome Orchestration",
    problem:
      "Manual coordination between HR, IT, and managers results in delayed laptop provisioning, missing credentials, and frustrated new hires.",
    solution:
      "When a new hire is confirmed in your HRIS, FlowPilot orchestrates the entire onboarding lifecycle: generates role-specific documentation with Gemini, emails credentials, waits for system provisioning, and notifies team channels.",
    pipeline: [
      { type: "TRIGGER", label: "HRIS Webhook", detail: "hr.candidate.hired", icon: Zap },
      { type: "AI", label: "Gemini 2.5 Flash", detail: "Role Playbook Generator", icon: Sparkles },
      { type: "EMAIL", label: "SMTP Delivery", detail: "Day 1 Welcome Packet", icon: Mail },
      { type: "DELAY", label: "Smart Delay", detail: "2-hour buffer for setup", icon: Clock },
      { type: "WEBHOOK", label: "Workspace API", detail: "Provision Slack & Google", icon: Globe },
    ],
    payloadPreview: `{
  "candidate": "Elena Rostova",
  "department": "Core Machine Learning",
  "playbook_generated": true,
  "credentials_dispatched": true,
  "status": "onboarding_active"
}`,
    metrics: ["0 Manual Checklists", "100% On-Time IT Setup", "Personalized Day 1 Schedule"],
  },
  {
    id: "customer-registration",
    tabTitle: "Customer Activation",
    badge: "Product Growth & Lifecycle",
    icon: UserCheck,
    title: "Context-Aware User Activation & Feature Guidance",
    problem:
      "Standard marketing drips send static emails that ignore what the customer actually signed up to build.",
    solution:
      "FlowPilot ingests sign-up metadata, runs an AI summary of user intent, delivers tailored instructions, and logs telemetry events into your product analytics pipeline.",
    pipeline: [
      { type: "TRIGGER", label: "App Signup Event", detail: "user.registered", icon: Zap },
      { type: "AI", label: "Gemini 2.5 Flash", detail: "Use-case Tailored Onboarding", icon: Sparkles },
      { type: "EMAIL", label: "SMTP Delivery", detail: "Tailored Starter Guide", icon: Mail },
      { type: "WEBHOOK", label: "Mixpanel / Segment", detail: "Track lifecycle event", icon: Globe },
    ],
    payloadPreview: `{
  "user_id": "usr_99120",
  "use_case_selected": "ecommerce_webhooks",
  "tailored_templates_sent": ["stripe_refunds", "shopify_order"],
  "activation_milestone": "step_1_completed"
}`,
    metrics: ["+28% Day-7 Retention", "Real-Time Ingestion", "Deterministic Step Retries"],
  },
  {
    id: "business-notifications",
    tabTitle: "Incident & Business Alerts",
    badge: "Site Reliability & Ops",
    icon: BellRing,
    title: "Automated Incident Escalation & Executive Summaries",
    problem:
      "Engineering monitors trigger alert storms that overwhelm teams without clear context or root-cause classification.",
    solution:
      "FlowPilot ingests system alerts, uses Gemini to categorize root causes and urgency, escalates via email to the primary on-call engineer, and updates status dashboards via webhook.",
    pipeline: [
      { type: "TRIGGER", label: "Monitoring Webhook", detail: "POST /alerts/ingest", icon: Zap },
      { type: "AI", label: "Gemini 2.5 Flash", detail: "Root Cause Classification", icon: Sparkles },
      { type: "EMAIL", label: "SMTP Urgent Dispatch", detail: "On-Call Emergency Alert", icon: Mail },
      { type: "WEBHOOK", label: "Status Page API", detail: "Incident Banner Sync", icon: Globe },
    ],
    payloadPreview: `{
  "alert": "db_replica_lag_high",
  "severity": "P1",
  "ai_analysis": "Replication lag exceeded 45s on eu-central read replica.",
  "escalated_to": "oncall-infra@flowpilot.io",
  "incident_state": "acknowledged"
}`,
    metrics: ["Sub-second Alert Relay", "Automated Triage", "Audit Log Trail"],
  },
];

export function UseCasesSection() {
  const [selectedCaseId, setSelectedCaseId] = useState("lead-processing");
  const activeCase = USE_CASES.find((c) => c.id === selectedCaseId) || USE_CASES[0];

  return (
    <section id="use-cases" className="relative py-24 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 mb-3">
            <span>Versatile Applications</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Built for any multi-step business process
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            From inbound lead routing to automated employee setup and system incident response, FlowPilot
            powers mission-critical workflows across your entire organization.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            const isSelected = uc.id === selectedCaseId;

            return (
              <button
                key={uc.id}
                onClick={() => setSelectedCaseId(uc.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{uc.tabTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Active Use Case Deep Dive */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 lg:p-10 backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 6 cols: Problem, Solution & Metrics */}
            <div className="lg:col-span-6 flex flex-col justify-between h-full">
              <div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-mono font-medium text-blue-400 border border-slate-700">
                  {activeCase.badge}
                </span>

                <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {activeCase.title}
                </h3>

                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                    <div className="text-xs font-mono uppercase text-rose-400 font-semibold mb-1">
                      The Operational Bottleneck
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {activeCase.problem}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                    <div className="text-xs font-mono uppercase text-emerald-400 font-semibold mb-1">
                      The FlowPilot Solution
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {activeCase.solution}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeCase.metrics.map((metric, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-medium"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>{metric}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 cols: Sequential Pipeline & Payload JSON */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {/* Sequential Steps in this use case */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 font-semibold">
                  Orchestrated Execution Sequence
                </div>
                <div className="space-y-2">
                  {activeCase.pipeline.map((step, idx) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-500 font-bold">0{idx + 1}</span>
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 text-blue-400">
                            <StepIcon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{step.label}</span>
                            <span className="text-[11px] font-mono text-slate-400">{step.detail}</span>
                          </div>
                        </div>
                        <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                          {step.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payload output */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">
                  Sample Execution State Payload
                </div>
                <pre className="rounded-lg bg-slate-900 border border-slate-800/80 p-3 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
                  {activeCase.payloadPreview}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
