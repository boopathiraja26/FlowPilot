import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";

export function InlineError({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className = "",
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-rose-900 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-rose-900">{title}</p>
          <p className="mt-0.5 text-sm text-rose-800">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="shrink-0 border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
          <RefreshCw className="h-3.5 w-3.5" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function PageLoadingState({
  label = "Loading",
  description = "Fetching the latest data…",
}: {
  label?: string;
  description?: string;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}