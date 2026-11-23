"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowUpDown,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  GitFork,
  Layers,
  LayoutGrid,
  List,
  PauseCircle,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { WorkflowCard } from "@/components/workflow/WorkflowCard";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/PageState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/lib/api";
import { Workflow, WorkflowStatus } from "@/types/workflow";

type ViewMode = "cards" | "table";
type SortOption = "updated_desc" | "updated_asc" | "name_asc" | "name_desc" | "status" | "executions_desc" | "last_run_desc" | "created_desc";

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function getLastRunTimestamp(workflow: Workflow): number {
  const value = workflow.lastExecution?.startedAt;
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | WorkflowStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("updated_desc");

  const [togglingWorkflowId, setTogglingWorkflowId] = useState<string | null>(null);
  const [duplicatingWorkflowId, setDuplicatingWorkflowId] = useState<string | null>(null);
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);

  async function fetchWorkflows() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/workflows");
      setWorkflows((response.data.data.workflows as Workflow[]) ?? []);
    } catch (err: any) {
      if (err?.response?.status === 401) return;
      setError(err?.response?.data?.message || "Couldn't load your workflows. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function handleDelete(workflowId: string) {
    const workflow = workflows.find((w) => w.id === workflowId);
    const label = workflow?.title ? `“${workflow.title}”` : "this workflow";
    const confirmed = window.confirm(`Delete ${label}? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingWorkflowId(workflowId);
    setActionError(null);
    setActionNotice(null);
    try {
      await api.delete(`/workflows/${workflowId}`);
      setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));
      setActionNotice("Workflow deleted.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to delete workflow.");
    } finally {
      setDeletingWorkflowId(null);
    }
  }

  async function handleDuplicate(workflowId: string) {
    setDuplicatingWorkflowId(workflowId);
    setActionError(null);
    setActionNotice(null);
    try {
      const response = await api.post(`/workflows/${workflowId}/duplicate`);
      const duplicated = response.data.data.workflow as Workflow;
      setWorkflows((prev) => [duplicated, ...prev]);
      setActionNotice("Workflow duplicated as a draft.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to duplicate workflow.");
    } finally {
      setDuplicatingWorkflowId(null);
    }
  }

  async function handleActivate(workflowId: string) {
    setTogglingWorkflowId(workflowId);
    setActionError(null);
    setActionNotice(null);
    try {
      const response = await api.post(`/workflows/${workflowId}/activate`);
      const updated = response.data.data.workflow as Workflow;
      setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? { ...w, status: updated.status, updatedAt: updated.updatedAt ?? w.updatedAt } : w)));
      setActionNotice("Workflow activated.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to activate workflow.");
    } finally {
      setTogglingWorkflowId(null);
    }
  }

  async function handleDeactivate(workflowId: string) {
    setTogglingWorkflowId(workflowId);
    setActionError(null);
    setActionNotice(null);
    try {
      const response = await api.post(`/workflows/${workflowId}/deactivate`);
      const updated = response.data.data.workflow as Workflow;
      setWorkflows((prev) => prev.map((w) => (w.id === workflowId ? { ...w, status: updated.status, updatedAt: updated.updatedAt ?? w.updatedAt } : w)));
      setActionNotice("Workflow deactivated.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Failed to deactivate workflow.");
    } finally {
      setTogglingWorkflowId(null);
    }
  }

  const stats = useMemo(() => {
    const activeCount = workflows.filter((w) => w.status === "ACTIVE").length;
    const draftCount = workflows.filter((w) => w.status === "DRAFT").length;
    const archivedCount = workflows.filter((w) => w.status === "ARCHIVED").length;
    const totalSteps = workflows.reduce((acc, w) => acc + (w.steps?.length ?? 0), 0);
    const totalExecutions = workflows.reduce((acc, w) => acc + (w.executionCount ?? 0), 0);
    return { activeCount, draftCount, archivedCount, totalSteps, totalExecutions };
  }, [workflows]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let items = workflows.filter((w) => {
      if (statusFilter !== "ALL" && w.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${w.title} ${w.description ?? ""} ${w.id}`.toLowerCase();
      return haystack.includes(q);
    });

    items = [...items].sort((a, b) => {
      switch (sortBy) {
        case "updated_asc":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name_asc":
          return a.title.localeCompare(b.title);
        case "name_desc":
          return b.title.localeCompare(a.title);
        case "status":
          return a.status.localeCompare(b.status) || b.updatedAt.localeCompare(a.updatedAt);
        case "executions_desc":
          return (b.executionCount ?? 0) - (a.executionCount ?? 0) || b.updatedAt.localeCompare(a.updatedAt);
        case "last_run_desc":
          return getLastRunTimestamp(b) - getLastRunTimestamp(a) || b.updatedAt.localeCompare(a.updatedAt);
        case "created_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "updated_desc":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return items;
  }, [workflows, searchQuery, statusFilter, sortBy]);

  const hasWorkflows = workflows.length > 0;
  const hasFilteredResults = filteredAndSorted.length > 0;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Automation</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Workflows</h1>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
                {workflows.length} total
              </span>
            </div>
            <p className="text-sm text-slate-600">Create, organize, activate, duplicate, and manage workflows with real execution activity.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={fetchWorkflows} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-ring">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link href="/dashboard/workflows/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-ring">
              <Plus className="h-4 w-4" />
              <span>Create workflow</span>
            </Link>
          </div>
        </div>

        {!isLoading && !error && hasWorkflows ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total workflows</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{workflows.length}</p>
                <p className="mt-0.5 text-xs text-slate-500">{stats.draftCount} draft · {stats.archivedCount} archived</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600"><GitFork className="h-5 w-5" /></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active workflows</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">{stats.activeCount}</p>
                <p className="mt-0.5 text-xs text-slate-500">Ready for triggers and runs</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Configured steps</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalSteps}</p>
                <p className="mt-0.5 text-xs text-slate-500">Across all workflows</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-600"><Layers className="h-5 w-5" /></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total executions</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalExecutions}</p>
                <p className="mt-0.5 text-xs text-slate-500">Real recorded activity</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"><Activity className="h-5 w-5" /></div>
            </div>
          </div>
        ) : null}

        {actionError ? (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-semibold">Action failed</p>
              <p className="text-sm">{actionError}</p>
            </div>
          </div>
        ) : null}
        {actionNotice ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium">{actionNotice}</p>
          </div>
        ) : null}

        {!isLoading && !error && hasWorkflows ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search workflows by name or description"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus-ring"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "ALL" | WorkflowStatus)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus-ring">
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                  <label className="ml-0 text-xs font-medium uppercase tracking-wide text-slate-500 sm:ml-2">Sort</label>
                  <div className="relative">
                    <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus-ring">
                      <option value="updated_desc">Recently updated</option>
                      <option value="updated_asc">Least recently updated</option>
                      <option value="created_desc">Recently created</option>
                      <option value="name_asc">Name (A–Z)</option>
                      <option value="name_desc">Name (Z–A)</option>
                      <option value="status">Status</option>
                      <option value="executions_desc">Most executions</option>
                      <option value="last_run_desc">Most recent run</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center self-start rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button type="button" onClick={() => setViewMode("cards")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "cards" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`} aria-pressed={viewMode === "cards"}>
                  <LayoutGrid className="h-4 w-4" /> Cards
                </button>
                <button type="button" onClick={() => setViewMode("table")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`} aria-pressed={viewMode === "table"}>
                  <List className="h-4 w-4" /> Table
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Showing {filteredAndSorted.length} of {workflows.length} workflows.</p>
          </div>
        ) : null}

        {isLoading ? (
          viewMode === "table" ? <TableSkeleton rows={6} /> : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
          )
        ) : null}

        {!isLoading && error ? <InlineError title="Couldn’t load workflows" message={error} onRetry={fetchWorkflows} /> : null}

        {!isLoading && !error && !hasWorkflows ? (
          <EmptyState
            icon={GitFork}
            title="No workflows created yet"
            description="Build your first automated pipeline with AI, Email, Webhook, and Delay steps. Once created, you can manage, activate, duplicate, and monitor real execution activity here."
            actionLabel="Create first workflow"
            onAction={() => { window.location.href = "/dashboard/workflows/new"; }}
            className="py-16"
          />
        ) : null}

        {!isLoading && !error && hasWorkflows && !hasFilteredResults ? (
          <EmptyState
            icon={Search}
            title="No workflows match your filters"
            description="Try adjusting your search, status filter, or sorting to find the workflow you’re looking for."
            actionLabel="Clear filters"
            onAction={() => { setSearchQuery(""); setStatusFilter("ALL"); setSortBy("updated_desc"); }}
            secondaryActionLabel="Refresh"
            onSecondaryAction={fetchWorkflows}
            className="py-14"
          />
        ) : null}

        {!isLoading && !error && hasFilteredResults && viewMode === "cards" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSorted.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
                isToggling={togglingWorkflowId === workflow.id}
                isDuplicating={duplicatingWorkflowId === workflow.id}
                isDeleting={deletingWorkflowId === workflow.id}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && hasFilteredResults && viewMode === "table" ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Steps</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Executions</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last execution</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAndSorted.map((workflow) => {
                    const busy = togglingWorkflowId === workflow.id || duplicatingWorkflowId === workflow.id || deletingWorkflowId === workflow.id;
                    const isActive = workflow.status === "ACTIVE";
                    return (
                      <tr key={workflow.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 align-top">
                          <div className="min-w-[220px] max-w-md">
                            <p className="truncate text-sm font-semibold text-slate-900">{workflow.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{workflow.description || "No description provided."}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top"><StatusBadge status={workflow.status} /></td>
                        <td className="px-5 py-4 align-top text-sm text-slate-700">{workflow.steps?.length ?? 0}</td>
                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-medium text-slate-900">{workflow.executionCount ?? 0}</div>
                          <div className="text-xs text-slate-500">total runs</div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          {workflow.lastExecution ? (
                            <div className="space-y-1.5">
                              <StatusBadge status={workflow.lastExecution.status} />
                              <p className="text-xs text-slate-500">{formatDateTime(workflow.lastExecution.startedAt)}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">No runs yet</span>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top text-sm text-slate-600">{formatDateTime(workflow.updatedAt)}</td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex min-w-[320px] flex-wrap items-center justify-end gap-2">
                            {isActive ? (
                              <button type="button" onClick={() => handleDeactivate(workflow.id)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50">
                                <PauseCircle className="h-3.5 w-3.5" />{togglingWorkflowId === workflow.id ? "Updating..." : "Deactivate"}
                              </button>
                            ) : (
                              <button type="button" onClick={() => handleActivate(workflow.id)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
                                <Power className="h-3.5 w-3.5" />{togglingWorkflowId === workflow.id ? "Updating..." : "Activate"}
                              </button>
                            )}
                            <button type="button" onClick={() => handleDuplicate(workflow.id)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                              <Copy className="h-3.5 w-3.5" />{duplicatingWorkflowId === workflow.id ? "Duplicating..." : "Duplicate"}
                            </button>
                            <Link href={`/dashboard/workflows/${workflow.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                              Open <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                            <button type="button" onClick={() => handleDelete(workflow.id)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
                              <Trash2 className="h-3.5 w-3.5" />{deletingWorkflowId === workflow.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}