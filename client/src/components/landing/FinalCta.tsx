"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Check } from "lucide-react";

export function FinalCta() {
  return (
    <section className="relative py-24 bg-[#101C2C] text-white overflow-hidden border-t border-[#163A46]">
      {/* Background glow accent */}
      <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-[#0D9488]/15 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300 mb-6 font-mono">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Start Automating Today</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Ready to make your workflows run themselves?
        </h2>

        <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
          Create your first intelligent pipeline in minutes. Build, test, and automate without writing glue code.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            prefetch={true}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-8 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#0F766E] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <span>Start Building with FlowPilot</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/login"
            prefetch={true}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
          >
            <span>Sign In to Your Workspace</span>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-teal-400" />
            <span>Free starter tier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-teal-400" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-teal-400" />
            <span>Setup in under 3 minutes</span>
          </div>
        </div>
      </div>
    </section>
  );
}
