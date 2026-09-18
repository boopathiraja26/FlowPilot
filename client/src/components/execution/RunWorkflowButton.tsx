"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface RunWorkflowButtonProps {
  workflowId: string;
  triggerData?: Record<string, unknown>;
  onSuccess?: (executionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function RunWorkflowButton({
  workflowId,
  triggerData,
  onSuccess,
  onError,
  className = "",
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-brand-glow transition-all duration-150 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 border border-blue-400/20 ${className}`}
    >
      {isRunning ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Executing Pipeline...</span>
        </>
      ) : (
        <>
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Execute Workflow</span>
        </>
      )}
    </button>
  );
}
