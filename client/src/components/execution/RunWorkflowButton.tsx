"use client";

import { useState } from "react";

import { api } from "@/lib/api";

interface RunWorkflowButtonProps {
  workflowId: string;
  triggerData?: Record<string, unknown>;
  onSuccess?: (executionId: string) => void;
  onError?: (error: string) => void;
}

export function RunWorkflowButton({
  workflowId,
  triggerData,
  onSuccess,
  onError,
}: RunWorkflowButtonProps) {
  const [isRunning, setIsRunning] = useState(false);

  async function handleRun() {
    setIsRunning(true);

    try {
      const response = await api.post(`/executions/${workflowId}`, triggerData ?? {});
      const executionId = response.data?.data?.execution?.id;

      if (onSuccess && executionId) {
        onSuccess(executionId);
      }
    } catch {
      if (onError) {
        onError("Failed to execute workflow.");
      }
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <button
      onClick={handleRun}
      disabled={isRunning}
      className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
    >
      {isRunning ? "Running..." : "Run Workflow"}
    </button>
  );
}
