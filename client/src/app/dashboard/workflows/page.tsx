"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, GitFork, CheckCircle2, Layers, AlertCircle } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { WorkflowCard } from "@/components/workflow/WorkflowCard";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { Workflow } from "@/types/workflow";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchWorkflows() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get("/workflows");
        if (!isCancelled) {
          setWorkflows(response.data.data.workflows as Workflow[]);
        }
      } catch (err) {
        if (!isCancelled) {
          setError("Couldn't load your workflows. Please try again.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchWorkflows();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleDelete(workflowId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this workflow?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/workflows/${workflowId}`);

      setWorkflows((prev) =>
        prev.filter((workflow) => workflow.id !== workflowId)
      );
    } catch (error) {
      alert("Failed to delete workflow.");
    }
  }

  const activeCount = workflows.filter((w) => w.status === "ACTIVE").length;
  const totalSteps = workflows.reduce((acc, w) => acc + (w.steps?.length ?? 0), 0);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Workflows</h2>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 border border-brand-100">
                {workflows.length} Total
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Build, automate, and orchestrate intelligent end-to-end pipelines.
            </p>
          </div>

          <Link
            href="/dashboard/workflows/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-brand-glow active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Create Workflow</span>
          </Link>
        </div>

        {/* Dashboard Statistics Summary Cards */}
        {!isLoading && !error && workflows.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Workflows</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{workflows.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                <GitFork className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Pipelines</p>
                <p className="mt-1 text-2xl font-black text-emerald-600">{activeCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Configured Steps</p>
                <p className="mt-1 text-2xl font-black text-purple-600">{totalSteps}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Layers className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 max-w-md shadow-sm">
              <AlertCircle className="h-6 w-6 shrink-0 text-rose-600" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && workflows.length === 0 && (
          <EmptyState
            title="No workflows created yet"
            description="Build your first automated pipeline with AI, Email, Webhook, and Delay steps."
            actionLabel="Create First Workflow"
            onAction={() => window.location.href = "/dashboard/workflows/new"}
            className="py-16"
          />
        )}

        {/* Workflow Cards Grid */}
        {!isLoading && !error && workflows.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
            {workflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}