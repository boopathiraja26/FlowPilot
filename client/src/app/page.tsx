import Link from "next/link";

// =========================================================
// Step badge style tokens (mirrors WorkflowStepNode.tsx exactly,
// so the marketing page and the real product speak one visual language)
// =========================================================

const STEP_STYLES = {
  TRIGGER: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  AI: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200", dot: "bg-purple-500" },
  EMAIL: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200", dot: "bg-blue-500" },
  WEBHOOK: { bg: "bg-pink-50", text: "text-pink-700", ring: "ring-pink-200", dot: "bg-pink-500" },
} as const;

// =========================================================
// Small inline icons (no new dependency — matches WorkflowToolbar.tsx pattern)
// =========================================================

function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 3 8l9 5 9-5-9-5ZM3 16l9 5 9-5M3 12l9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h4l2 8 4-16 2 8h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlug() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 7V3M15 7V3M8 10h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-3ZM12 17v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// =========================================================
// Reusable: a single step badge used across hero/preview/use-case
// =========================================================

function StepBadge({
  type,
  label,
  size = "md",
}: {
  type: keyof typeof STEP_STYLES;
  label: string;
  size?: "sm" | "md";
}) {
  const style = STEP_STYLES[type];
  const padding = size === "sm" ? "px-3 py-2" : "px-4 py-2.5";

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-gray-200 ${style.bg} ${padding} shadow-sm ring-1 ${style.ring} transition-transform hover:-translate-y-0.5`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
      <span className={`text-xs font-semibold ${style.text}`}>{type}</span>
      <span className="text-sm font-medium text-gray-800">{label}</span>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex items-center justify-center px-1 sm:px-2">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
        <path d="M4 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" className="hidden sm:block" />
        <path d="M12 4v13M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden" />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ================================================= */}
      {/* Navbar */}
      {/* ================================================= */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-sm">
              FP
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">FlowPilot</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ================================================= */}
      {/* Hero */}
      {/* ================================================= */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: "radial-gradient(circle, #c7d2fe 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse 65% 55% at 50% 0%, black 40%, transparent 100%)",
          }}
        />

        {/* Ambient step badges — quiet, off to the sides, desktop only, echo the product's own visual language */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <div className="absolute left-[6%] top-28 -rotate-6 opacity-70">
            <StepBadge type="TRIGGER" label="New signup" size="sm" />
          </div>
          <div className="absolute right-[7%] top-20 rotate-3 opacity-70">
            <StepBadge type="AI" label="Draft summary" size="sm" />
          </div>
          <div className="absolute bottom-16 left-[10%] rotate-2 opacity-60">
            <StepBadge type="EMAIL" label="Notify team" size="sm" />
          </div>
          <div className="absolute bottom-10 right-[9%] -rotate-3 opacity-60">
            <StepBadge type="WEBHOOK" label="Sync CRM" size="sm" />
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 text-center sm:pb-32 sm:pt-28">
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-gray-500 shadow-sm">
            Workflow automation, simplified
          </div>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
            <span className="block bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Build powerful workflows.
            </span>
            <span className="mt-1 block text-gray-400">Automate the work that follows.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-gray-600">
            FlowPilot helps teams build, execute, and monitor automated workflows with AI, email,
            webhooks, delays, and more — all from one visual workspace.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/25 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:w-auto"
            >
              Start building for free
              <IconArrowRight />
            </Link>
            <Link
              href="/login"
              className="w-full rounded-lg border border-gray-200 bg-white px-7 py-3.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
            >
              Explore workflows
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Product Preview */}
      {/* ================================================= */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-xl shadow-gray-200/60">
          {/* Fake window chrome, ties the preview to a real app surface */}
          <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <span className="ml-3 font-mono text-[11px] text-gray-400">flowpilot.app/dashboard/workflows</span>
          </div>

          {/* Canvas-style area with dot grid, echoing the real ReactFlow builder */}
          <div
            className="relative flex flex-col items-center gap-3 px-6 py-16 sm:flex-row sm:justify-center sm:gap-0"
            style={{
              backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <StepBadge type="TRIGGER" label="Employee added" />
            <FlowConnector />
            <StepBadge type="AI" label="Generate message" />
            <FlowConnector />
            <StepBadge type="EMAIL" label="Send welcome email" />
            <FlowConnector />
            <StepBadge type="WEBHOOK" label="Notify Slack" />
          </div>
        </div>
        <p className="mt-5 text-center font-mono text-xs uppercase tracking-wider text-gray-400">
          Create → Connect → Automate
        </p>
      </section>

      {/* ================================================= */}
      {/* How it works */}
      {/* ================================================= */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            How FlowPilot works
          </h2>

          <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {/* Connecting line across the three steps, desktop only */}
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-gray-200 sm:block" />

            {[
              {
                num: "01",
                title: "Create your workflow",
                desc: "Start with a trigger and define what should happen.",
              },
              {
                num: "02",
                title: "Connect your steps",
                desc: "Combine AI, email, delays, webhooks, and other actions.",
              },
              {
                num: "03",
                title: "Execute and monitor",
                desc: "Run workflows and track execution results from one place.",
              },
            ].map((step) => (
              <div key={step.num} className="relative">
                <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white font-mono text-sm font-semibold text-brand-600 shadow-sm">
                  {step.num}
                </span>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Features */}
      {/* ================================================= */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Everything you need to automate work
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {[
            {
              icon: <IconSpark />,
              title: "AI-powered automation",
              desc: "Use AI steps to generate intelligent workflow outputs.",
            },
            {
              icon: <IconLayers />,
              title: "Visual workflow builder",
              desc: "Build workflows visually using connected steps.",
            },
            {
              icon: <IconActivity />,
              title: "Execution monitoring",
              desc: "Track workflow runs and inspect execution results.",
            },
            {
              icon: <IconPlug />,
              title: "Flexible integrations",
              desc: "Connect email, webhooks, delays, and external services.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-gray-200 p-6 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md hover:shadow-gray-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* Use case example */}
      {/* ================================================= */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Automate repetitive workflows
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-500">
            An example of a real workflow teams build with FlowPilot.
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4 sm:px-8">
              <p className="font-mono text-xs uppercase tracking-wider text-gray-400">
                Employee Onboarding
              </p>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                Active
              </span>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-0">
                <StepBadge type="TRIGGER" label="Employee Added" />
                <div className="ml-4 h-5 w-px bg-gray-200" />
                <StepBadge type="AI" label="Generate onboarding message" />
                <div className="ml-4 h-5 w-px bg-gray-200" />
                <StepBadge type="EMAIL" label="Send welcome email" />
                <div className="ml-4 h-5 w-px bg-gray-200" />
                <StepBadge type="WEBHOOK" label="Notify another system" />
              </div>

              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                Build this workflow
                <IconArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Final CTA */}
      {/* ================================================= */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 px-8 py-16 text-center sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage: "radial-gradient(ellipse 60% 80% at 50% 50%, black 20%, transparent 100%)",
            }}
          />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to automate your workflow?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-300">
              Build your first workflow with FlowPilot and see how simple automation can be.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-gray-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Get started for free
              <IconArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* Footer */}
      {/* ================================================= */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row sm:gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-[10px] font-bold text-white">
                FP
              </div>
              <span className="text-sm font-semibold text-gray-900">FlowPilot</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">Workflow automation, simplified.</p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link href="/dashboard/workflows" className="transition-colors hover:text-gray-900">
              Workflows
            </Link>
            <Link href="/dashboard/executions" className="transition-colors hover:text-gray-900">
              Executions
            </Link>
            <Link href="/login" className="transition-colors hover:text-gray-900">
              Login
            </Link>
            <Link href="/register" className="transition-colors hover:text-gray-900">
              Get Started
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}