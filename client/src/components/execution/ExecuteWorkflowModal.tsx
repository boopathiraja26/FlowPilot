"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  FileJson,
  Loader2,
  Play,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useDialogFocus } from "@/hooks/useDialogFocus";

export type RuntimeTriggerPayload = Record<string, unknown>;

interface ExecutionLog {
  stepName?: string;
  stepType?: string;
  status?: string;
  message?: string | null;
}

interface ExecuteWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (payload: RuntimeTriggerPayload) => Promise<unknown>;
  initialValues?: RuntimeTriggerPayload;
  workflowTitle?: string;
  isExecuting?: boolean;
  executionError?: string | null;
}

type ModalPhase = "form" | "executing" | "queued" | "running" | "success" | "failed";

const ONBOARDING_SAMPLE: RuntimeTriggerPayload = {
  event: "employee_added",
  employee_name: "Ava Patel",
  employee_email: "you@example.test",
  job_title: "Software Engineer",
  department: "Engineering",
  manager_name: "Jordan Lee",
  manager_email: "manager@example.test",
  start_date: "2026-12-01",
  company_name: "Acme",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getExecutionResult(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const data = isRecord(value.data) ? value.data : null;
  return data && isRecord(data.execution) ? data.execution : null;
}

export function ExecuteWorkflowModal({
  isOpen,
  onClose,
  onExecute,
  initialValues,
  workflowTitle,
  isExecuting,
  executionError,
}: ExecuteWorkflowModalProps) {
  const router = useRouter();
  const [payloadText, setPayloadText] = useState("{}");
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<ModalPhase>("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const isBusy = phase === "executing" || Boolean(isExecuting);
  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, () => {
    if (!isBusy) onClose();
  });

  const applyExecution = useCallback((execution: Record<string, unknown>) => {
    if (typeof execution.id !== "string") return;
    setExecutionId(execution.id);

    const executionLogs = Array.isArray(execution.logs) ? execution.logs : [];
    setLogs(
      executionLogs.filter(isRecord).map((log) => ({
        stepName: typeof log.stepName === "string" ? log.stepName : undefined,
        stepType: typeof log.stepType === "string" ? log.stepType : undefined,
        status: typeof log.status === "string" ? log.status : undefined,
        message:
          typeof log.message === "string" || log.message === null
            ? log.message
            : undefined,
      }))
    );

    if (execution.status === "COMPLETED") {
      setPhase("success");
    } else if (execution.status === "FAILED") {
      setErrorMessage(
        typeof execution.failureReason === "string"
          ? execution.failureReason
          : "Execution failed. Inspect its step logs before starting another run."
      );
      setPhase("failed");
    } else if (execution.status === "RUNNING") {
      setPhase("running");
    } else {
      setPhase("queued");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setPayloadText(JSON.stringify(initialValues ?? {}, null, 2));
    setPayloadError(null);
    setPhase("form");
    setErrorMessage(null);
    setExecutionId(null);
    setLogs([]);
    setPollingError(null);
  }, [isOpen, initialValues]);

  useEffect(() => {
    if (
      !isOpen ||
      !executionId ||
      (phase !== "queued" && phase !== "running")
    ) {
      return;
    }

    let isCancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function pollExecution() {
      try {
        const response = await api.get(`/executions/${executionId}`);
        const execution = getExecutionResult(response.data);
        if (!execution) {
          throw new Error("Execution status is unavailable.");
        }
        if (isCancelled) return;

        setPollingError(null);
        applyExecution(execution);
        if (execution.status === "QUEUED" || execution.status === "RUNNING") {
          timer = setTimeout(pollExecution, 1500);
        }
      } catch {
        if (isCancelled) return;
        setPollingError("Status refresh is temporarily unavailable; this execution remains recorded.");
        timer = setTimeout(pollExecution, 3000);
      }
    }

    timer = setTimeout(pollExecution, 1000);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [applyExecution, executionId, isOpen, phase]);

  if (!isOpen) return null;

  function loadOnboardingSample() {
    setPayloadText(JSON.stringify(ONBOARDING_SAMPLE, null, 2));
    setPayloadError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "executing" || isExecuting) return;

    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      setPayloadError("Enter valid JSON before running this workflow.");
      return;
    }

    if (!isRecord(payload)) {
      setPayloadError("The trigger payload must be a JSON object.");
      return;
    }

    setPayloadError(null);
    setErrorMessage(null);
    setExecutionId(null);
    setLogs([]);
    setPhase("executing");
    setPollingError(null);

    try {
      const response = await onExecute(payload);
      const execution = getExecutionResult(response);

      if (
        !execution ||
        !["QUEUED", "RUNNING", "COMPLETED", "FAILED"].includes(
          String(execution.status)
        ) ||
        typeof execution.id !== "string"
      ) {
        throw new Error("The server did not return an execution record.");
      }

      applyExecution(execution);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : executionError || "Workflow execution failed."
      );
      setPhase("failed");
    }
  }

  const displayedError = errorMessage || executionError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close execution dialog"
        className="fixed inset-0 cursor-default"
        onClick={() => {
          if (!isBusy) onClose();
        }}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="execute-workflow-title"
        tabIndex={-1}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-dark-900/95 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-brand-glow">
              <Zap className="h-5 w-5 fill-current" />
            </span>
            <div>
              <h2 id="execute-workflow-title" className="text-base font-extrabold text-white">
                {phase === "form"
                  ? "Execute Workflow"
                  : phase === "executing"
                      ? "Queueing Workflow"
                      : phase === "queued"
                        ? "Workflow Queued"
                        : phase === "running"
                          ? "Running Workflow"
                    : phase === "success"
                      ? "Workflow Completed"
                      : "Execution Failed"}
              </h2>
              {workflowTitle && (
                <p className="mt-0.5 text-[11px] font-semibold text-blue-400">
                  {workflowTitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200 disabled:opacity-30"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {phase === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {payloadError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
                  {payloadError}
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <label
                    htmlFor="trigger-payload"
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    <FileJson className="h-4 w-4 text-blue-400" />
                    Trigger payload
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    Provide any JSON object. Steps can reference values with {"{{trigger.key}}"}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadOnboardingSample}
                  className="rounded-lg border border-white/[0.1] bg-dark-850 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-dark-800 hover:text-white"
                >
                  Load onboarding example
                </button>
              </div>

              <textarea
                id="trigger-payload"
                value={payloadText}
                onChange={(event) => {
                  setPayloadText(event.target.value);
                  if (payloadError) setPayloadError(null);
                }}
                spellCheck={false}
                rows={14}
                className={`w-full rounded-2xl border bg-dark-950 px-4 py-3 font-mono text-xs leading-relaxed text-slate-100 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 ${
                  payloadError
                    ? "border-rose-500/50"
                    : "border-white/[0.08] hover:border-white/[0.16]"
                }`}
                aria-describedby="trigger-payload-help"
              />
              <p id="trigger-payload-help" className="text-[11px] text-slate-500">
                Replace example addresses before sending email. Payload values are passed to workflow steps.
              </p>

              <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/[0.08] bg-dark-850 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-dark-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-brand-glow transition-all hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isBusy ? "Running..." : "Run Workflow"}</span>
                </button>
              </div>
            </form>
          )}

          {(phase === "executing" || phase === "queued" || phase === "running") && (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-sm font-bold text-white">
                {phase === "executing"
                  ? "Queueing workflow"
                  : phase === "queued"
                    ? "Waiting for a worker"
                    : "Executing workflow steps"}
              </p>
              <p className="text-xs text-slate-400">
                Execution ID: {executionId || "Creating execution record"}
              </p>
              {pollingError && (
                <p role="status" className="max-w-sm text-xs text-amber-300">
                  {pollingError}
                </p>
              )}
            </div>
          )}

          {phase === "success" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-emerald-300">
                    Execution completed and was recorded.
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] text-emerald-200/70">
                    Execution ID: {executionId}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Recorded step results
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {logs.length} {logs.length === 1 ? "step" : "steps"}
                  </span>
                </div>
                {logs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/[0.12] p-4 text-xs text-slate-400">
                    This execution returned no step logs.
                  </p>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={`${log.stepName || "step"}-${index}`}
                      className="rounded-xl border border-white/[0.08] bg-dark-950 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-white">
                            {log.stepName || `Step ${index + 1}`}
                          </p>
                          <p className="mt-1 text-[10px] font-mono uppercase text-slate-500">
                            {log.stepType || "Workflow step"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            log.status === "COMPLETED"
                              ? "bg-emerald-950/70 text-emerald-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {log.status || "RECORDED"}
                        </span>
                      </div>
                      {log.message && (
                        <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-300">
                          {log.message}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (executionId) {
                      onClose();
                      router.push(`/dashboard/executions/${executionId}`);
                    }
                  }}
                  disabled={!executionId}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-dark-850 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-dark-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Inspect execution
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-brand-glow transition-all hover:from-blue-500 hover:to-indigo-500"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {phase === "failed" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/50 p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-rose-400">
                  <XCircle className="h-4 w-4" />
                  <span>Execution Error</span>
                </div>
                <p className="font-mono text-xs leading-relaxed text-rose-200">
                  {displayedError || "An error occurred during workflow execution."}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-rose-200/80">
                  Automatic retries are disabled. External effects may have occurred; inspect the execution before starting another run.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
                {executionId && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/dashboard/executions/${executionId}`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-dark-850 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-dark-800"
                  >
                    Inspect execution
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-dark-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-dark-750"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
