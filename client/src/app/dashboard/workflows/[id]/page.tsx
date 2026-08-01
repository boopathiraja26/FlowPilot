"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { WorkflowCard } from "@/components/workflow/WorkflowCard";
import { api } from "@/lib/api";
import { Workflow } from "@/types/workflow";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchWorkflows = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get("/workflows");

        if (!cancelled) {
          setWorkflows(response.data.data.workflows ?? []);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setError("Couldn't load your workflows. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchWorkflows();

    return () => {
      cancelled = true;
    };
  }, []);

  // Placeholder until DELETE endpoint is wired up
  const handleDelete = (workflowId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this workflow?"
    );

    if (!confirmed) return;

    console.log("Delete workflow:", workflowId);
  };

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor your AI automations.
          </p>
        </div>

        <Link
          href="/dashboard/workflows/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          + New Workflow
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
            <p className="text-sm text-gray-500">Loading workflows...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="font-semibold text-red-700">
            Failed to load workflows
          </h3>

          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && workflows.length === 0 && (
        <div className="flex h-[60vh] items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">
              No workflows yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Create your first workflow to start automating tasks.
            </p>

            <Link
              href="/dashboard/workflows/new"
              className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Create Workflow
            </Link>
          </div>
        </div>
      )}

      {/* Workflow Grid */}
      {!isLoading && !error && workflows.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}