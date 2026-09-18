import Link from "next/link";
import { ArrowRight, Clock, Activity } from "lucide-react";

import { WorkflowExecution } from "@/types/execution";
import { ExecutionStatusBadge } from "./ExecutionStatusBadge";

// =========================================================
// Helpers
// =========================================================

function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) {
    return "--";
  }

  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

  if (durationMs < 0) {
    return "--";
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

// =========================================================
// ExecutionCard
// =========================================================

interface ExecutionCardProps {
  execution: WorkflowExecution;
}

export function ExecutionCard({ execution }: ExecutionCardProps) {
  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-dark-900/90 p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-brand-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
            {execution.workflow?.title ?? "Untitled workflow"}
          </p>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            {formatDateTime(execution.startedAt)}
          </p>
        </div>
        <ExecutionStatusBadge status={execution.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Completed
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-300">
            {execution.completedAt ? formatDateTime(execution.completedAt) : "--"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Duration
          </p>
          <p className="mt-1 text-xs font-mono font-bold text-blue-400">
            {formatDuration(execution.startedAt, execution.completedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-white/[0.06] pt-4">
        <Link
          href={`/dashboard/executions/${execution.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-dark-850 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:bg-dark-800 hover:border-white/[0.16] hover:text-white"
        >
          <span>Inspect Log</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
