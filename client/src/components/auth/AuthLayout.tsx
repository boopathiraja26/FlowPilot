"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Workflow, Zap, Sparkles, Mail, Globe, ArrowRight } from "lucide-react";

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
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50/70 bg-grid-pattern px-4 py-8 sm:py-12 overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Subtle Ambient Radial Gradients */}
      <div className="pointer-events-none absolute top-1/4 -left-32 h-[450px] w-[450px] rounded-full bg-brand-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 -right-32 h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center lg:flex-row lg:items-center lg:justify-between lg:gap-12 xl:gap-16">
        
        {/* Left Side: Refined Integrated FlowPilot Workflow Visual (Desktop only) */}
        <div className={`hidden lg:flex flex-col gap-6 w-[360px] xl:w-[400px] shrink-0 ${isRegister ? "opacity-90" : "opacity-75"} transition-opacity duration-300`}>
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-700 border border-brand-100/80 w-fit">
              <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
              <span>WORKFLOW AUTOMATION</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 leading-snug">
              Orchestrate Intelligent Pipelines End-to-End
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect triggers, AI steps, email dispatchers, and webhooks in real time.
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
                className="text-slate-200"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle
                r="3"
                className="fill-brand-600 animate-pulse"
                style={{
                  cx: "0",
                  cy: "0",
                  animation: "flowSignal 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
            </svg>

            {/* Step 1: Trigger */}
            <div className="relative z-10 flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-subtle backdrop-blur-md transition-all hover:border-emerald-300 hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Trigger</span>
                  <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">Webhook Event</p>
                <p className="text-[11px] text-slate-400 truncate">HTTP POST Payload Received</p>
              </div>
            </div>

            {/* Step 2: AI Step */}
            <div className="relative z-10 flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-subtle backdrop-blur-md transition-all hover:border-purple-300 hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold border border-purple-100">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">AI Step</span>
                  <span className="text-[10px] font-mono text-slate-400">Gemini 2.5</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">Context Resolution</p>
                <p className="text-[11px] text-slate-400 truncate">Extracted Intent & Params</p>
              </div>
            </div>

            {/* Step 3: Email */}
            <div className="relative z-10 flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-subtle backdrop-blur-md transition-all hover:border-blue-300 hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Email</span>
                  <span className="text-[10px] font-mono text-slate-400">SMTP Active</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">Notification Dispatch</p>
                <p className="text-[11px] text-slate-400 truncate">Sent to stakeholder queue</p>
              </div>
            </div>

            {/* Step 4: Webhook Sync */}
            <div className="relative z-10 flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-subtle backdrop-blur-md transition-all hover:border-pink-300 hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600 font-bold border border-pink-100">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600">Webhook</span>
                  <span className="text-[10px] font-mono text-slate-400">200 OK</span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">System Synchronized</p>
                <p className="text-[11px] text-slate-400 truncate">State updated across workspace</p>
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
              className="group inline-flex items-center justify-center gap-2.5 rounded-2xl p-1.5 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              title="Return to FlowPilot Home"
              aria-label="FlowPilot Home"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-brand-glow transition-all duration-200 group-hover:bg-brand-700 group-hover:shadow-lg group-hover:shadow-brand-600/30">
                <Workflow className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-brand-600">
                FlowPilot
              </span>
            </Link>

            {badgeText && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50/90 px-3 py-0.5 text-[11px] font-bold text-brand-700 border border-brand-100 shadow-subtle mx-auto">
                {badgeIcon}
                <span>{badgeText}</span>
              </div>
            )}

            <h1 className="mt-3.5 text-2xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>

            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Compact Auth Card Surface */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-card transition-all">
            {children}

            {/* Footer Link Navigation */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              {bottomQuestion}{" "}
              <Link
                href={bottomLinkHref}
                className="font-bold text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
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
