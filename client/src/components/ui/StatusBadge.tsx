import React from "react";
import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";

export type ExecutionStatus = "COMPLETED" | "RUNNING" | "FAILED" | "PENDING";

interface StatusBadgeProps {
  status: ExecutionStatus | string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className = "", showIcon = true }: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase() as ExecutionStatus;

  switch (normalized) {
    case "COMPLETED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60 shadow-sm ${className}`}
        >
          {showIcon && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          <span>Completed</span>
        </span>
      );

    case "RUNNING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 border border-brand-200/80 shadow-sm ${className}`}
        >
          {showIcon && <Loader2 className="h-3.5 w-3.5 text-brand-600 animate-spin" />}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600"></span>
          </span>
          <span>Executing</span>
        </span>
      );

    case "FAILED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200/60 shadow-sm ${className}`}
        >
          {showIcon && <AlertCircle className="h-3.5 w-3.5 text-rose-600" />}
          <span>Failed</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200 ${className}`}
        >
          {showIcon && <Clock className="h-3.5 w-3.5 text-slate-500" />}
          <span>{status}</span>
        </span>
      );
  }
}
