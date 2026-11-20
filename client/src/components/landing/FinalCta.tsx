"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export function FinalCta() {
  return (
    <section className="relative py-24 bg-slate-950 overflow-hidden border-t border-slate-800/80">
      {/* Background glow accent */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Start Automating Today</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Ready to make your workflows run themselves?
        </h2>

        <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
          Create your first intelligent pipeline in minutes. Build, test, and deploy without writing glue code.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span>Start Building with FlowPilot</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-8 py-4 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-[0.98]"
          >
            <span>Sign In to Existing Account</span>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Free starter tier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Setup in under 3 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
