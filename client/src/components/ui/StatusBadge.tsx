import React from "react";
import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";

export type ExecutionStatus = "COMPLETED" | "RUNNING" | "FAILED" | "PENDING" | "ACTIVE" | "DRAFT" | "ARCHIVED";

interface StatusBadgeProps {
  status: ExecutionStatus | string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className = "", showIcon = true }: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase() as ExecutionStatus;

  switch (normalized) {
    case "COMPLETED":
    case "ACTIVE":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 ${className}`}
        >
          {showIcon && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          <span>{normalized === "ACTIVE" ? "Active" : "Completed"}</span>
        </span>
      );

    case "RUNNING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 ${className}`}
        >
          {showIcon && <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span>Running</span>
        </span>
      );

    case "FAILED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200 ${className}`}
        >
          {showIcon && <AlertCircle className="h-3.5 w-3.5 text-rose-600" />}
          <span>Failed</span>
        </span>
      );

    case "ARCHIVED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 ${className}`}
        >
          {showIcon && <Clock className="h-3.5 w-3.5 text-amber-600" />}
          <span>Archived</span>
        </span>
      );

    case "DRAFT":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200 ${className}`}
        >
          {showIcon && <Clock className="h-3.5 w-3.5 text-slate-500" />}
          <span>{normalized === "DRAFT" ? "Draft" : status || "Pending"}</span>
        </span>
      );
  }
}
