"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Workflow, Zap, Sparkles, Mail, Globe, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeIcon?: ReactNode;
  bottomQuestion: string;
  bottomLinkText: string;
  bottomLinkHref: string;
  pageType?: "login" | "register";
  children: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  badgeText,
  badgeIcon,
  bottomQuestion,
  bottomLinkText,
  bottomLinkHref,
  pageType = "login",
  children,
}: AuthLayoutProps) {
  const isRegister = pageType === "register";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-dark-950 bg-grid-pattern px-4 py-8 sm:py-12 overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute top-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-blue-600/[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-600/[0.08] blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center lg:flex-row lg:items-center lg:justify-between lg:gap-12 xl:gap-16">
        
        {/* Left Side: Refined Integrated FlowPilot Workflow Visual (Desktop only) */}
        <div className={`hidden lg:flex flex-col gap-6 w-[380px] xl:w-[420px] shrink-0 ${isRegister ? "opacity-95" : "opacity-90"} transition-opacity duration-300`}>
          <div className="flex flex-col gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-950/60 px-3 py-1 text-[11px] font-bold text-blue-400 border border-blue-500/30 w-fit shadow-[0_0_12px_-2px_rgba(59,130,246,0.3)]">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>WORKFLOW AUTOMATION ENGINE</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white leading-snug">
              Orchestrate Intelligent Pipelines End-to-End
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect triggers, Gemini AI resolution, SMTP email dispatchers, and custom webhooks with real-time telemetry.
            </p>
          </div>

          {/* Connected Vertical Automation Pipeline */}
          <div className="relative flex flex-col gap-3 py-2 pl-2">
            {/* SVG Connecting Path with Traveling Signal Pulse */}
            <svg className="absolute left-[27px] top-6 bottom-6 w-0.5 h-[calc(100%-48px)] overflow-visible" fill="none">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="100%"
                stroke="currentColor"
                className="text-slate-800"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle
                r="3"
                className="fill-blue-500 animate-pulse shadow-brand-glow"
                style={{
                  cx: "0",
                  cy: "0",
                  animation: "flowSignal 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
            </svg>

            {/* Step 1: Trigger */}
            <div className="relative z-10 flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-dark-900/90 p-3.5 shadow-card backdrop-blur-xl transition-all hover:border-emerald-500/40 hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.15)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-500/30 shadow-[0_0_12px_-2px_rgba(16,185,129,0.2)]">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Trigger</span>
                  <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">Active</span>
                </div>
                <p className="text-xs font-bold text-slate-100 truncate">Webhook Event</p>
                <p className="text-[11px] text-slate-400 truncate font-mono">POST /api/webhooks/intake</p>
              </div>
            </div>

            {/* Step 2: AI Step */}
            <div className="relative z-10 flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-dark-900/90 p-3.5 shadow-card backdrop-blur-xl transition-all hover:border-purple-500/40 hover:shadow-[0_0_20px_-3px_rgba(168,85,247,0.15)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-950/60 text-purple-400 font-bold border border-purple-500/30 shadow-[0_0_12px_-2px_rgba(168,85,247,0.2)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">AI Step</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-dark-800 px-1.5 py-0.5 rounded border border-white/[0.06]">Gemini 2.5</span>
                </div>
                <p className="text-xs font-bold text-slate-100 truncate">Context Resolution</p>
                <p className="text-[11px] text-slate-400 truncate">Dynamic payload processing</p>
              </div>
            </div>

            {/* Step 3: Email */}
            <div className="relative z-10 flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-dark-900/90 p-3.5 shadow-card backdrop-blur-xl transition-all hover:border-blue-500/40 hover:shadow-[0_0_20px_-3px_rgba(59,130,246,0.15)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-950/60 text-blue-400 font-bold border border-blue-500/30 shadow-[0_0_12px_-2px_rgba(59,130,246,0.2)]">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Email</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-dark-800 px-1.5 py-0.5 rounded border border-white/[0.06]">SMTP Dispatch</span>
                </div>
                <p className="text-xs font-bold text-slate-100 truncate">Notification Queue</p>
                <p className="text-[11px] text-slate-400 truncate font-mono">status: 250 OK queued</p>
              </div>
            </div>

            {/* Step 4: Webhook Sync */}
            <div className="relative z-10 flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-dark-900/90 p-3.5 shadow-card backdrop-blur-xl transition-all hover:border-pink-500/40 hover:shadow-[0_0_20px_-3px_rgba(236,72,153,0.15)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-950/60 text-pink-400 font-bold border border-pink-500/30 shadow-[0_0_12px_-2px_rgba(236,72,153,0.2)]">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Webhook</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">200 OK</span>
                </div>
                <p className="text-xs font-bold text-slate-100 truncate">System Sync</p>
                <p className="text-[11px] text-slate-400 truncate">Payload broadcast complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Compact Premium Authentication Card */}
        <div className="w-full max-w-[420px] shrink-0 animate-scale-in">
          {/* Brand Header */}
          <div className="mb-6 text-center">
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-2.5 rounded-2xl p-1.5 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Return to FlowPilot Home"
              aria-label="FlowPilot Home"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-brand-glow transition-all duration-200 group-hover:shadow-brand-glow-lg">
                <Workflow className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white transition-colors group-hover:text-blue-400">
                FlowPilot
              </span>
            </Link>

            {badgeText && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-950/60 px-3 py-0.5 text-[11px] font-bold text-blue-400 border border-blue-500/30 shadow-[0_0_12px_-2px_rgba(59,130,246,0.3)] mx-auto">
                {badgeIcon}
                <span>{badgeText}</span>
              </div>
            )}

            <h1 className="mt-3.5 text-2xl font-extrabold tracking-tight text-white">
              {title}
            </h1>

            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Compact Auth Card Surface */}
          <div className="rounded-3xl border border-white/[0.08] bg-dark-900/90 p-6 sm:p-8 shadow-card backdrop-blur-xl transition-all">
            {children}

            {/* Footer Link Navigation */}
            <div className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400">
              {bottomQuestion}{" "}
              <Link
                href={bottomLinkHref}
                className="font-bold text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                {bottomLinkText}
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Inline Keyframe for Smooth Flow Signal Animation */}
      <style jsx global>{`
        @keyframes flowSignal {
          0% {
            cy: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            cy: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
