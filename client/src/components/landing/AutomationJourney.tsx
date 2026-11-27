import { Activity, ArrowDown, Mail, Sparkles, Zap } from "lucide-react";

import { LandingReveal } from "./LandingReveal";

const JOURNEY = [
  {
    step: "01",
    label: "Trigger",
    title: "Start from an event you choose.",
    description:
      "Launch a run from a manual action, an incoming webhook, or a schedule. The trigger payload becomes the context for the steps that follow.",
    detail: "Manual · Webhook · Schedule",
    icon: Zap,
  },
  {
    step: "02",
    label: "Transform",
    title: "Pass useful context between steps.",
    description:
      "Map earlier outputs into later actions. Add Gemini when a workflow needs a configured AI model to summarize or transform information.",
    detail: "Mapped values · Gemini AI",
    icon: Sparkles,
  },
  {
    step: "03",
    label: "Deliver",
    title: "Connect the tools that finish the work.",
    description:
      "Send email through your SMTP settings or make a configured HTTP request. Slack and Discord notifications can be part of the flow.",
    detail: "SMTP · HTTP · Notifications",
    icon: Mail,
  },
  {
    step: "04",
    label: "Observe",
    title: "Keep the whole execution understandable.",
    description:
      "Review run status and step results in one history. Durable queueing and retries help work continue through restarts and temporary failures.",
    detail: "Queue · Retry · Execution history",
    icon: Activity,
  },
];

export function AutomationJourney() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-ui-bg py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8">
        <LandingReveal direction="left" className="lg:sticky lg:top-32 lg:self-start">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ui-accent">
            A workflow, end to end
          </p>
          <h2 className="max-w-lg text-3xl font-semibold leading-[1.12] tracking-[-0.045em] text-ui-primary sm:text-4xl lg:text-[2.8rem]">
            From the first signal to a result you can inspect.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-ui-secondary">
            FlowPilot keeps the trigger, the work between steps, and the final outcome in one
            connected execution model.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-ui-border bg-ui-surface px-3.5 py-2 text-xs text-ui-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-ui-accent" />
            One trace from trigger to completion
          </div>
        </LandingReveal>

        <ol className="relative border-l border-ui-border">
          {JOURNEY.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={item.step} className="relative pb-10 pl-7 last:pb-0 sm:pl-10">
                <LandingReveal direction="right" delay={index * 70}>
                  <span className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full border border-ui-border bg-ui-bg text-ui-accent">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px] tabular-nums text-ui-muted">{item.step}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ui-accent">
                      {item.label}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-ui-primary sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-ui-secondary sm:text-base">
                    {item.description}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-ui-muted">
                    {item.detail}
                    {index < JOURNEY.length - 1 && <ArrowDown className="h-3 w-3" aria-hidden="true" />}
                  </p>
                </LandingReveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
