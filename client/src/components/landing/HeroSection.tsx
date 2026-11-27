import Link from "next/link";
import { ArrowDown, ArrowRight, Check } from "lucide-react";

import { LandingReveal } from "./LandingReveal";
import { WorkflowProductDemo } from "./WorkflowProductDemo";

const CAPABILITY_NOTES = ["Visual workflow builder", "Durable execution queue", "Step-level history"];

export function HeroSection() {
  return (
    <section id="hero" className="flow-hero relative isolate overflow-hidden">
      <div className="flow-hero-lines" aria-hidden="true" />
      <div className="flow-hero-grain" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-16 lg:pt-[4.5rem]">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
          <LandingReveal direction="left" className="max-w-[35rem]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-white/75">
              <span className="flow-hero-indicator" aria-hidden="true" />
              Workflow automation, made observable
            </div>

            <h1 className="max-w-[14ch] text-[2.7rem] font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl lg:text-[3.5rem] xl:text-[4.25rem]">
              Workflows run automatically.
              <span className="mt-1 block text-[#f3c568]">You stay in control.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
              Connect triggers, AI models and external services in one visual workspace. Automate
              repetitive processes and monitor every execution.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="flow-hero-primary">
                Start building
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/login" className="flow-hero-secondary">
                Sign in
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5 text-xs text-white/65 sm:text-sm">
              {CAPABILITY_NOTES.map((note) => (
                <li key={note} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#eec16a]" aria-hidden="true" />
                  {note}
                </li>
              ))}
            </ul>
          </LandingReveal>

          <LandingReveal direction="right" delay={100} className="min-w-0">
            <WorkflowProductDemo />
          </LandingReveal>
        </div>

        <a
          href="#how-it-works"
          className="mt-12 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-white/50 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c568] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b3032] lg:mt-10"
        >
          Follow a workflow from signal to result
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
