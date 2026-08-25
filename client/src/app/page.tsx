"use client";

import { useState, useEffect } from "react";
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
  Play,
  ShieldCheck,
  Cpu,
} from "lucide-react";

// =========================================================
// Demo Workflow Node Data shape
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

const DEMO_STEPS: DemoStep[] = [
  {
    id: "step-1",
    type: "TRIGGER",
    title: "Employee Added",
    subtitle: "Webhook: hr.event.signup",
    icon: Zap,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    glowRing: "ring-emerald-400/50 shadow-emerald-500/20",
    dotBg: "bg-emerald-500",
  },
  {
    id: "step-2",
    type: "AI",
    title: "Generate Welcome",
    subtitle: "Gemini 2.5: HR Assistant",
    icon: Sparkles,
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    glowRing: "ring-purple-400/50 shadow-purple-500/20",
    dotBg: "bg-purple-600",
  },
  {
    id: "step-3",
    type: "EMAIL",
    title: "Send Onboarding Email",
    subtitle: "SMTP: boopathiraja26ab@gmail.com",
    icon: Mail,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    glowRing: "ring-blue-400/50 shadow-blue-500/20",
    dotBg: "bg-blue-600",
  },
  {
    id: "step-4",
    type: "WEBHOOK",
    title: "Sync Team Portal",
    subtitle: "POST: api.company.com/sync",
    icon: Globe,
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    glowRing: "ring-pink-400/50 shadow-pink-500/20",
    dotBg: "bg-pink-600",
  },
];

// =========================================================
// Hero Live Interactive Workflow Demo Component
// =========================================================

function HeroWorkflowDemo() {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  // Check reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    if (mediaQuery.matches) {
      setCompletedSteps(new Set([0, 1, 2, 3]));
      setActiveStepIndex(-1);
    }
  }, []);

  // Sequential execution step loop
  useEffect(() => {
    if (isReducedMotion) return;

    const interval = setInterval(() => {
      setActiveStepIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;

        if (nextIndex >= DEMO_STEPS.length) {
          // Execution complete state, hold briefly then reset
          setTimeout(() => {
            setCompletedSteps(new Set());
            setActiveStepIndex(0);
          }, 2400);

          setCompletedSteps(new Set([0, 1, 2, 3]));
          return DEMO_STEPS.length;
        }

        setCompletedSteps((prev) => new Set([...Array.from(prev), prevIndex]));
        return nextIndex;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isReducedMotion]);

  return (
    <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white/95 p-4 sm:p-6 shadow-card backdrop-blur-xl overflow-hidden">
      {/* Demo Header Toolbar */}
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-rose-400" />
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-400" />
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400" />
          <span className="font-mono text-xs font-semibold text-slate-500 ml-1 truncate">
            live_pipeline_execution.demo
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeStepIndex >= 0 && activeStepIndex < DEMO_STEPS.length ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 border border-brand-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
              <span>Step {activeStepIndex + 1} Executing...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Pipeline Passed (100%)</span>
            </span>
          )}
        </div>
      </div>

      {/* Workflow Canvas Grid with Nodes - responsive flex container with overflow protection */}
      <div className="relative min-h-[200px] w-full rounded-xl bg-slate-50/60 bg-grid-pattern p-4 sm:p-5 border border-slate-100 overflow-x-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 min-w-full">
          {DEMO_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isExecuting = activeStepIndex === index;
            const isDone = completedSteps.has(index) || activeStepIndex > index;

            return (
              <div key={step.id} className="flex flex-col lg:flex-row items-center w-full lg:w-1/4 min-w-0">
                {/* Node Card */}
                <div
                  className={`group relative w-full rounded-2xl border bg-white p-3.5 shadow-subtle transition-all duration-300 ${
                    isExecuting
                      ? `border-brand-500 ring-4 ${step.glowRing} animate-pulse-glow scale-[1.02]`
                      : isDone
                      ? "border-emerald-300 ring-1 ring-emerald-200"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                          isExecuting ? "bg-brand-600 text-white" : `${step.bg} ${step.text}`
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        #{index + 1}
                      </span>
                    </div>

                    {isExecuting ? (
                      <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-bold text-brand-700">
                        <Loader2 className="h-2.5 w-2.5 animate-spin text-brand-600" />
                        <span>Active</span>
                      </span>
                    ) : isDone ? (
                      <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
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

                  {/* Node Title & Subtitle */}
                  <div className="mt-2.5 min-w-0">
                    <h4 className="truncate text-xs font-bold text-slate-900" title={step.title}>
                      {step.title}
                    </h4>
                    <p className="mt-1 truncate font-mono text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title={step.subtitle}>
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                {/* Edge Connection Line */}
                {index < DEMO_STEPS.length - 1 && (
                  <div className="my-2 lg:my-0 lg:mx-1 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 lg:w-6 lg:h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path
                        d="M4 12h16M14 6l6 6-6 6"
                        className={`transition-colors duration-300 ${
                          activeStepIndex === index
                            ? "stroke-brand-600 animate-flow-dash stroke-[3]"
                            : isDone
                            ? "stroke-emerald-500"
                            : "stroke-slate-300"
                        }`}
                      />
                    </svg>
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


// =========================================================
// Main Landing Page Component
// =========================================================

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* ================================================= */}
      {/* Navbar */}
      {/* ================================================= */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform duration-200 hover:-translate-y-0.5"
            title="FlowPilot Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-brand-glow transition-all duration-200 group-hover:bg-brand-700">
              <Workflow className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors leading-none">
                FlowPilot
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-brand-600 uppercase mt-0.5">
                Automations
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"
            >
              Log In
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-brand-glow active:scale-[0.98]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ================================================= */}
      {/* Hero Section */}
      {/* ================================================= */}
      <section className="relative overflow-hidden bg-grid-pattern pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white px-3.5 py-1 text-xs font-bold text-brand-700 shadow-subtle animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span>Intelligent SaaS Workflow Automation Engine</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-[1.1]">
            Orchestrate Workflows. <br />
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 bg-clip-text text-transparent">
              Automate Execution.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 leading-relaxed sm:text-lg">
            Build end-to-end automated pipelines with AI content resolution, SMTP email dispatch, webhooks, and step-by-step execution tracking.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition-all duration-150 hover:bg-brand-700 hover:shadow-brand-glow hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span>Build First Workflow</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-subtle transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
            >
              <span>View Live Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Live Interactive Workflow Pipeline Demo */}
        <div className="mt-14 px-4 sm:px-6">
          <HeroWorkflowDemo />
        </div>
      </section>

      {/* ================================================= */}
      {/* How It Works Section */}
      {/* ================================================= */}
      <section className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Simple 3-Step Setup</span>
            <h2 className="mt-1 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
              How FlowPilot Executes Automations
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Define Trigger & Prompt",
                desc: "Describe what starts the workflow or input payload parameters in plain text.",
                icon: GitFork,
              },
              {
                num: "02",
                title: "Chain AI & Service Steps",
                desc: "Connect Gemini AI resolution, SMTP Email, Webhook POSTs, and Delay timers.",
                icon: Layers,
              },
              {
                num: "03",
                title: "Execute & Monitor Logs",
                desc: "Run pipeline executions with live step-by-step output tracking and error logs.",
                icon: Activity,
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="group relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 shadow-subtle transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-card hover:border-brand-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-brand-600">{step.num}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100 group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Feature Cards Section */}
      {/* ================================================= */}
      <section className="py-20 bg-slate-50/60 border-t border-slate-200/80">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Engine Features</span>
            <h2 className="mt-1 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
              Engineered for SaaS & Developers
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-subtle transition-all duration-200 hover:-translate-y-1 hover:shadow-card hover:border-slate-300"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Final CTA Section */}
      {/* ================================================= */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-10 text-center shadow-card sm:p-14">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-brand-500/20 blur-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white sm:text-4xl tracking-tight">
                Ready to Automate Your Workflows?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300">
                Join FlowPilot to create, execute, and monitor intelligent workflows in minutes.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-xs font-bold text-white shadow-brand-glow transition-all duration-150 hover:bg-brand-700 hover:scale-105 active:scale-[0.98]"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-xs font-bold text-slate-200 transition-all duration-150 hover:bg-slate-700 hover:text-white active:scale-[0.98]"
                >
                  <span>Existing User Login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Footer */}
      {/* ================================================= */}
      <footer className="border-t border-slate-200/80 bg-slate-50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Workflow className="h-4 w-4" />
            </div>
            <span>FlowPilot</span>
          </Link>

          <p className="text-xs text-slate-500 font-medium">
            © 2026 FlowPilot Inc. Workflow Automation Engine. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/login" className="hover:text-brand-600 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-brand-600 transition-colors">Register</Link>
            <Link href="/dashboard/workflows" className="hover:text-brand-600 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}