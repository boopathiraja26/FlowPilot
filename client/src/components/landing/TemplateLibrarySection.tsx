import Link from "next/link";
import { ArrowUpRight, Bot, Clock3, Mail, Users, Webhook } from "lucide-react";

import { LandingReveal } from "./LandingReveal";

const TEMPLATES = [
  {
    number: "01",
    category: "People",
    title: "Employee onboarding",
    summary: "Turn a new-hire event into a personalized welcome email.",
    steps: ["Manual trigger", "Gemini", "Email"],
    icon: Users,
  },
  {
    number: "02",
    category: "AI & content",
    title: "AI email generation",
    summary: "Draft an email from a request, then send it through configured SMTP.",
    steps: ["Request", "Gemini", "Email"],
    icon: Bot,
  },
  {
    number: "03",
    category: "Customer success",
    title: "Customer feedback analysis",
    summary: "Summarize incoming feedback and deliver an actionable report.",
    steps: ["Webhook", "Gemini", "Email"],
    icon: Mail,
  },
  {
    number: "04",
    category: "Operations",
    title: "Scheduled reminders",
    summary: "Prepare a reminder and run it on a chosen cadence and timezone.",
    steps: ["Schedule", "Prepare", "Email"],
    icon: Clock3,
  },
  {
    number: "05",
    category: "Integrations",
    title: "Webhook automation",
    summary: "Receive a signed event and forward its payload to a REST endpoint.",
    steps: ["Webhook", "Map data", "HTTP"],
    icon: Webhook,
  },
];

export function TemplateLibrarySection() {
  return (
    <section id="templates" className="scroll-mt-24 bg-ui-bg py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <LandingReveal direction="left">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ui-accent">
              A useful first draft
            </p>
            <h2 className="max-w-lg text-3xl font-semibold leading-[1.12] tracking-[-0.045em] text-ui-primary sm:text-4xl">
              Start with a pattern. Make it yours.
            </h2>
          </LandingReveal>
          <LandingReveal direction="right" delay={80}>
            <p className="max-w-2xl text-sm leading-6 text-ui-secondary sm:ml-auto sm:text-base">
              Choose a starting workflow for a common task, inspect its steps, and configure the
              connections and inputs your process needs.
            </p>
          </LandingReveal>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)]">
          <div className="divide-y divide-ui-border border-y border-ui-border">
            {TEMPLATES.map((template, index) => {
              const Icon = template.icon;
              return (
                <LandingReveal key={template.number} direction="up" delay={index * 45}>
                  <Link
                    href="/register"
                    className="group grid gap-3 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    aria-label={`Start with the ${template.title} template`}
                  >
                    <span className="flex min-w-0 items-start gap-3.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ui-border bg-ui-surface text-ui-accent transition-colors group-hover:border-ui-accent/40">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-ui-primary">{template.title}</span>
                          <span className="text-[10px] font-medium uppercase tracking-wide text-ui-muted">
                            {template.category}
                          </span>
                        </span>
                        <span className="mt-1 block max-w-lg text-xs leading-5 text-ui-secondary">
                          {template.summary}
                        </span>
                      </span>
                    </span>

                    <span className="ml-[50px] flex flex-wrap items-center gap-1.5 sm:ml-0 sm:justify-end">
                      {template.steps.map((step, stepIndex) => (
                        <span key={step} className="inline-flex items-center gap-1.5">
                          <span className="rounded border border-ui-border bg-ui-surface px-2 py-1 text-[9px] font-medium text-ui-secondary">
                            {step}
                          </span>
                          {stepIndex < template.steps.length - 1 && (
                            <span className="h-px w-2 bg-ui-border" aria-hidden="true" />
                          )}
                        </span>
                      ))}
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5 text-ui-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ui-accent" />
                    </span>
                  </Link>
                </LandingReveal>
              );
            })}
          </div>

          <LandingReveal direction="right" delay={120}>
            <aside className="h-full rounded-xl border border-ui-border bg-ui-surface p-6 sm:p-7">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ui-accent/10 text-ui-accent">
                <Webhook className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-ui-accent">
                Keep control
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ui-primary">
                Templates open as drafts.
              </h3>
              <p className="mt-3 text-sm leading-6 text-ui-secondary">
                Imported workflows stay inactive until you configure the required fields and
                connections. Review the steps before you decide to activate them.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg border border-ui-border px-3.5 text-xs font-semibold text-ui-primary transition-colors hover:border-ui-accent/40 hover:text-ui-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                Explore the templates
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </aside>
          </LandingReveal>
        </div>
      </div>
    </section>
  );
}
