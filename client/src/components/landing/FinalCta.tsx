import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { LandingReveal } from "./LandingReveal";

export function FinalCta() {
  return (
    <section className="flow-final-cta relative isolate overflow-hidden border-t border-white/10 py-20 text-white sm:py-28">
      <div className="flow-final-lines" aria-hidden="true" />
      <LandingReveal className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f3c568]">
          Make the next run visible
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl">
          Give repetitive work a clear path forward.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
          Start with a workflow, configure the services it needs, and keep each execution easy to follow.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="flow-hero-primary">
            Start building
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-semibold text-white/85 transition-colors hover:border-white/35 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c568] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3032]"
          >
            Sign in
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </LandingReveal>
    </section>
  );
}
