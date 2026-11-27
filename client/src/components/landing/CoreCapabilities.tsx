import { ArrowRight, Check, Clock, Mail, Sparkles, Webhook } from "lucide-react";
import type { ReactNode } from "react";

import { LandingReveal } from "./LandingReveal";

export function CoreCapabilities() {
  return (
    <section id="features" className="scroll-mt-24 border-y border-ui-border bg-ui-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <LandingReveal direction="left">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ui-accent">
              Designed for the whole run
            </p>
            <h2 className="max-w-md text-3xl font-semibold leading-[1.12] tracking-[-0.045em] text-ui-primary sm:text-4xl">
              Build the path. Keep the context.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-ui-secondary">
              Create workflows visually, wire values from earlier steps into later ones, and
              inspect the results without leaving the workspace.
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ui-accent/10 text-ui-accent">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="text-sm leading-6 text-ui-secondary">
                  Connect webhook, manual, and scheduled triggers to workflow steps.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ui-accent/10 text-ui-accent">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="text-sm leading-6 text-ui-secondary">
                  Configure AI, email, delays, and HTTP actions with mapped inputs.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ui-accent/10 text-ui-accent">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="text-sm leading-6 text-ui-secondary">
                  Inspect step-level status and output from the execution history.
                </span>
              </li>
            </ul>
          </LandingReveal>

          <LandingReveal direction="right" delay={100}>
            <BuilderPreview />
          </LandingReveal>
        </div>
      </div>
    </section>
  );
}

function BuilderPreview() {
  return (
    <figure className="overflow-hidden rounded-xl border border-ui-border bg-ui-bg shadow-[0_18px_50px_-30px_rgba(20,35,32,0.35)]">
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-ui-divider px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ui-accent text-[10px] font-bold text-ui-bg">
            F
          </span>
          <span className="truncate text-xs font-semibold text-ui-primary">Employee onboarding</span>
          <span className="hidden rounded-full border border-ui-border px-2 py-0.5 text-[9px] font-medium text-ui-muted sm:inline-flex">
            Draft
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-ui-muted">
          <Clock className="h-3 w-3" aria-hidden="true" />
          Updated moments ago
        </span>
      </div>

      <div className="grid min-h-[310px] sm:grid-cols-[minmax(0,1.1fr)_minmax(180px,0.9fr)]">
        <div className="relative overflow-hidden border-b border-ui-divider p-4 sm:border-b-0 sm:border-r sm:p-5">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.22]" aria-hidden="true" />
          <div className="relative flex items-center justify-between text-[10px] text-ui-muted">
            <span>WORKFLOW CANVAS</span>
            <span>3 connected steps</span>
          </div>

          <div className="relative mt-5 space-y-2.5">
            <CanvasStep icon={<Webhook className="h-3.5 w-3.5" />} label="New employee" kind="TRIGGER" tone="green" />
            <div className="ml-[19px] h-4 border-l border-dashed border-ui-muted/50" aria-hidden="true" />
            <CanvasStep icon={<Sparkles className="h-3.5 w-3.5" />} label="Draft welcome message" kind="GEMINI AI" tone="violet" selected />
            <div className="ml-[19px] h-4 border-l border-dashed border-ui-muted/50" aria-hidden="true" />
            <CanvasStep icon={<Mail className="h-3.5 w-3.5" />} label="Send welcome email" kind="EMAIL" tone="blue" />
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ui-muted">Step settings</span>
            <span className="rounded border border-ui-border px-1.5 py-0.5 text-[9px] text-ui-muted">02</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-ui-primary">
            <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-300" aria-hidden="true" />
            Draft welcome message
          </div>
          <p className="mt-2 text-[11px] leading-5 text-ui-secondary">
            Use trigger fields to create a message with the right context.
          </p>

          <div className="mt-4 rounded-lg border border-ui-border bg-ui-surface p-3">
            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ui-muted">Prompt</span>
            <p className="mt-2 text-[10px] leading-5 text-ui-secondary">
              Write a welcome note for{" "}
              <span className="rounded bg-ui-accent/10 px-1 py-0.5 font-mono text-ui-accent">
                {"{{trigger.employee_name}}"}
              </span>
              .
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-ui-divider pt-3 text-[10px]">
            <span className="text-ui-muted">Output mapping</span>
            <span className="inline-flex items-center gap-1 text-ui-accent">
              Connect next step <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        Example FlowPilot workflow builder with a webhook trigger, Gemini AI step, and email action.
      </figcaption>
    </figure>
  );
}

function CanvasStep({
  icon,
  label,
  kind,
  tone,
  selected = false,
}: {
  icon: ReactNode;
  label: string;
  kind: string;
  tone: "green" | "violet" | "blue";
  selected?: boolean;
}) {
  const toneClass = {
    green: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
    violet: "text-violet-700 dark:text-violet-300 bg-violet-500/10",
    blue: "text-sky-700 dark:text-sky-300 bg-sky-500/10",
  }[tone];

  return (
    <div
      className={`flex min-h-12 items-center gap-2.5 rounded-lg border px-2.5 py-2 ${
        selected ? "border-ui-accent/40 bg-ui-surface shadow-sm ring-1 ring-ui-accent/10" : "border-ui-border bg-ui-surface/80"
      }`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${toneClass}`}>{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-ui-primary">{label}</span>
      <span className={`hidden rounded px-1.5 py-1 text-[8px] font-semibold tracking-wide sm:inline-flex ${toneClass}`}>
        {kind}
      </span>
    </div>
  );
}
