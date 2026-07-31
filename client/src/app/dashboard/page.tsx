import { DashboardShell } from "@/components/layout/DashboardShell";

const stats = [
  { label: "Active Projects", value: "12" },
  { label: "Open Tasks", value: "48" },
  { label: "Team Members", value: "9" },
  { label: "Completed This Week", value: "23" },
];

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500">A quick snapshot of your workspace.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900">Recent activity</h3>
        <p className="mt-2 text-sm text-gray-500">
          This is placeholder content. Wire this up to real data once the API and
          authentication layers are implemented.
        </p>
      </div>
    </DashboardShell>
  );
}
