import { ChevronDown } from "lucide-react";

import { LandingReveal } from "./LandingReveal";

const QUESTIONS = [
  {
    question: "What can I build with FlowPilot?",
    answer:
      "Create workflows that start from manual, webhook, or scheduled triggers and connect configured AI, email, delay, HTTP, and notification steps.",
  },
  {
    question: "Do I need to write code?",
    answer:
      "The visual builder lets you connect and configure workflow steps without writing orchestration code. You still provide the inputs, credentials, and endpoint details each step requires.",
  },
  {
    question: "How do I know what happened during a run?",
    answer:
      "Execution history shows the workflow status and step-level results so you can inspect inputs, outputs, and failures.",
  },
  {
    question: "Can a workflow run on a schedule or wait between steps?",
    answer:
      "Yes. Configure recurring schedules with a timezone, or add a durable delay that resumes the workflow later.",
  },
  {
    question: "Are imported templates activated automatically?",
    answer:
      "No. Templates create an inactive draft. Configure the required fields and service connections, review the steps, and activate it when it is ready.",
  },
];

export function FaqSection() {
  return (
    <section id="questions" className="scroll-mt-24 border-t border-ui-border bg-ui-surface py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-8">
        <LandingReveal direction="left">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-ui-accent">
            Frequently asked
          </p>
          <h2 className="max-w-sm text-3xl font-semibold leading-[1.12] tracking-[-0.045em] text-ui-primary sm:text-4xl">
            A few useful details.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-ui-secondary">
            Learn how triggers, connections, schedules, and execution history fit together.
          </p>
        </LandingReveal>

        <div className="divide-y divide-ui-border border-y border-ui-border">
          {QUESTIONS.map((item, index) => (
            <LandingReveal key={item.question} direction="right" delay={index * 50}>
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-1 text-sm font-semibold text-ui-primary marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus sm:text-base">
                  {item.question}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-ui-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <p className="max-w-2xl pb-2 pr-8 pt-3 text-sm leading-6 text-ui-secondary">
                  {item.answer}
                </p>
              </details>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
