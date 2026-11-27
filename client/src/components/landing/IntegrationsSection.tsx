import { ArrowUpRight, Bot, Globe, Mail, MessageSquare, Webhook } from "lucide-react";

import { LandingReveal } from "./LandingReveal";

const CONNECTIONS = [
  {
    icon: Bot,
    category: "AI",
    name: "Gemini",
    detail: "Generate and transform workflow context with a configured model.",
  },
  {
    icon: Mail,
    category: "Email",
    name: "SMTP",
    detail: "Send messages from workflow data through your mail provider.",
  },
  {
    icon: Globe,
    category: "Requests",
    name: "HTTP / REST",
    detail: "Call configured endpoints with mapped headers and payloads.",
  },
  {
    icon: Webhook,
    category: "Events",
    name: "Webhooks",
    detail: "Start runs with incoming events and send data to external services.",
  },
  {
    icon: MessageSquare,
    category: "Notifications",
    name: "Slack & Discord",
    detail: "Route workflow notifications through configured service connections.",
  },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="scroll-mt-24 border-y border-ui-border bg-ui-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <LandingReveal direction="left">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ui-accent">
              Connections that do real work
            </p>
            <h2 className="max-w-md text-3xl font-semibold leading-[1.12] tracking-[-0.045em] text-ui-primary sm:text-4xl">
              Use the services your workflows depend on.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-ui-secondary sm:text-base">
              Configure each connection in your workspace, then choose where it belongs in a
              workflow. Credentials stay in settings rather than in public workflow copy.
            </p>
          </LandingReveal>

          <div className="divide-y divide-ui-border border-y border-ui-border">
            {CONNECTIONS.map((connection, index) => {
              const Icon = connection.icon;
              return (
                <LandingReveal key={connection.name} direction="right" delay={index * 55}>
                  <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ui-border bg-ui-bg text-ui-accent">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.13em] text-ui-muted">
                          {connection.category}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold text-ui-primary">
                          {connection.name}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs leading-5 text-ui-secondary sm:text-sm">{connection.detail}</p>
                  </div>
                </LandingReveal>
              );
            })}
          </div>
        </div>

        <p className="mt-7 flex items-center gap-2 text-[11px] leading-5 text-ui-muted">
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ui-accent" aria-hidden="true" />
          Availability depends on configuring the relevant service connection and workflow step.
        </p>
      </div>
    </section>
  );
}
