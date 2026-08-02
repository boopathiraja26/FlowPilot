"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { WorkflowCard } from "@/components/workflow/WorkflowCard";
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

  function handleDelete(workflowId: string): void {
    // eslint-disable-next-line no-console
    console.log("Delete requested for workflow:", workflowId);
  }

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Workflows</h2>
          <p className="text-sm text-gray-500">Manage and monitor your automations.</p>
        </div>
        <Link
          href="/dashboard/workflows/new"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Workflow
        </Link>
      </div>

      {isLoading && (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
            <p className="text-sm">Loading workflows...</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="max-w-sm rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && workflows.length === 0 && (
        <div className="flex h-[50vh] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">No workflows yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Create your first workflow to get started.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && workflows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}