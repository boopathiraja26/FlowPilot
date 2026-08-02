import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-brand-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            FP
          </div>
          <span className="text-lg font-semibold text-gray-900">FlowPilot</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
        <span className="mb-4 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
          Project management, streamlined
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Plan, track, and ship work with FlowPilot
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-gray-600">
          A clean, fast workspace for teams to manage projects end-to-end —
          from planning to delivery — without the clutter.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Log in
          </Link>
        </div>
      </main>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-3">
        {[
          { title: "Fast setup", desc: "Spin up projects and boards in seconds." },
          { title: "Team-first", desc: "Built around collaboration, not clutter." },
          { title: "Reliable", desc: "A solid foundation that scales with you." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}