"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarClock, Pause, Play, Trash2 } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Workflow } from "@/types/workflow";

interface WorkflowSchedule {
  id: string;
  workflowId: string;
  firstRunAt: string;
  nextRunAt: string | null;
  intervalMinutes: number | null;
  isActive: boolean;
  createdAt: string;
  workflow: Pick<Workflow, "id" | "title" | "status">;
}

function formatDate(value: string | null): string {
  if (!value) return "Completed";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<WorkflowSchedule[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [firstRunAt, setFirstRunAt] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState("");
  const [triggerInput, setTriggerInput] = useState("{}");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyScheduleId, setBusyScheduleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadSchedules() {
      setIsLoading(true);
      setError(null);
      try {
        const [scheduleResponse, workflowResponse] = await Promise.all([
          api.get("/schedules"),
          api.get("/workflows"),
        ]);
        const scheduleData = scheduleResponse.data?.data?.schedules;
        const workflowData = workflowResponse.data?.data?.workflows;
        if (!Array.isArray(scheduleData) || !Array.isArray(workflowData)) {
          throw new Error("Unexpected schedule response");
        }
        if (!cancelled) {
          setSchedules(scheduleData as WorkflowSchedule[]);
          setWorkflows(
            (workflowData as Workflow[]).filter(
              (workflow) => workflow.status === "ACTIVE"
            )
          );
        }
      } catch {
        if (!cancelled) {
          setError("Could not load schedules. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadSchedules();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    let parsedTriggerInput: unknown;
    try {
      parsedTriggerInput = JSON.parse(triggerInput);
    } catch {
      setError("Trigger input must be valid JSON.");
      return;
    }
    if (
      typeof parsedTriggerInput !== "object" ||
      parsedTriggerInput === null ||
      Array.isArray(parsedTriggerInput)
    ) {
      setError("Trigger input must be a JSON object.");
      return;
    }

    const firstRun = new Date(firstRunAt);
    if (Number.isNaN(firstRun.getTime()) || firstRun.getTime() <= Date.now()) {
      setError("Choose a first run time in the future.");
      return;
    }

    const interval = intervalMinutes.trim()
      ? Number(intervalMinutes)
      : undefined;
    if (
      interval !== undefined &&
      (!Number.isInteger(interval) || interval < 5 || interval > 525600)
    ) {
      setError("Recurring intervals must be between 5 minutes and 1 year.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/schedules", {
        workflowId: selectedWorkflow,
        firstRunAt: firstRun.toISOString(),
        ...(interval === undefined ? {} : { intervalMinutes: interval }),
        triggerInput: parsedTriggerInput,
      });
      setFirstRunAt("");
      setIntervalMinutes("");
      setTriggerInput("{}");
      setNotice("Schedule created.");
      setReloadKey((key) => key + 1);
    } catch {
      setError(
        "Schedule could not be created. Confirm the workflow is active and the trigger data contains no credentials."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function setScheduleActive(schedule: WorkflowSchedule, isActive: boolean) {
    setError(null);
    setNotice(null);
    setBusyScheduleId(schedule.id);
    try {
      await api.patch(`/schedules/${schedule.id}`, { isActive });
      setReloadKey((key) => key + 1);
    } catch {
      setError("Schedule could not be updated. Refresh and try again.");
    } finally {
      setBusyScheduleId(null);
    }
  }

  async function removeSchedule(schedule: WorkflowSchedule) {
    if (!window.confirm("Remove this schedule? Already queued runs are not cancelled.")) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusyScheduleId(schedule.id);
    try {
      await api.delete(`/schedules/${schedule.id}`);
      setNotice("Schedule removed.");
      setReloadKey((key) => key + 1);
    } catch {
      setError("Schedule could not be removed. Refresh and try again.");
    } finally {
      setBusyScheduleId(null);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Schedules
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Run active workflows once or on a recurring minute interval. Scheduled runs use the same queued execution worker and execution history as manual runs.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">Create a schedule</h2>
              <p className="text-xs text-slate-500">Only active workflows can be scheduled.</p>
            </div>
          </div>
          {workflows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Activate a workflow before creating a schedule.
            </p>
          ) : (
            <form onSubmit={(event) => void createSchedule(event)} className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                Workflow
                <select
                  value={selectedWorkflow}
                  onChange={(event) => setSelectedWorkflow(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="" disabled>Select an active workflow</option>
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>{workflow.title}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                First run (your local time)
                <input
                  type="datetime-local"
                  value={firstRunAt}
                  onChange={(event) => setFirstRunAt(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                Repeat every (minutes, optional)
                <input
                  type="number"
                  min="5"
                  max="525600"
                  step="1"
                  value={intervalMinutes}
                  onChange={(event) => setIntervalMinutes(event.target.value)}
                  placeholder="Leave blank for one-time"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 md:col-span-2">
                Trigger input (JSON object)
                <textarea
                  value={triggerInput}
                  onChange={(event) => setTriggerInput(event.target.value)}
                  rows={4}
                  spellCheck={false}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm font-normal normal-case tracking-normal text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                <span className="font-normal normal-case tracking-normal text-slate-500">
                  Stored with the schedule. Do not include passwords, API keys, tokens, or other credentials.
                </span>
              </label>
              <div className="md:col-span-2">
                <Button type="submit" isLoading={isSaving}>Create schedule</Button>
              </div>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">Your schedules</h2>
          {isLoading ? (
            <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading schedules…</p>
          ) : schedules.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No schedules yet. Create a one-time or recurring run above.
            </p>
          ) : (
            schedules.map((schedule) => {
              const isCompleted = schedule.nextRunAt === null;
              const isWorkflowInactive = schedule.workflow.status !== "ACTIVE";
              const status = isCompleted
                ? "Completed"
                : !schedule.isActive
                  ? "Paused"
                  : isWorkflowInactive
                    ? "Waiting for active workflow"
                    : "Scheduled";

              return (
                <article key={schedule.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-900">{schedule.workflow.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {schedule.intervalMinutes === null
                        ? "One-time"
                        : `Repeats every ${schedule.intervalMinutes} minutes`}
                      {" · Next run: "}{formatDate(schedule.nextRunAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {status}{isWorkflowInactive && !isCompleted ? " · Activate the workflow to resume scheduled runs." : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!isCompleted && (
                      <Button
                        type="button"
                        variant="outline"
                        isLoading={busyScheduleId === schedule.id}
                        onClick={() => void setScheduleActive(schedule, !schedule.isActive)}
                      >
                        {schedule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {schedule.isActive ? "Pause" : "Resume"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="danger"
                      isLoading={busyScheduleId === schedule.id}
                      onClick={() => void removeSchedule(schedule)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <p className="text-xs leading-relaxed text-slate-500">
          The worker checks for due schedules every 15 seconds. Times are stored in UTC. If the worker is offline, a due occurrence runs once after it returns; missed intervals are coalesced rather than replayed. Each occurrence is a new execution, not a retry of an earlier run.
        </p>
      </div>
    </DashboardShell>
  );
}
