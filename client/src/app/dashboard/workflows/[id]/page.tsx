"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { WorkflowToolbar } from "@/components/workflow/WorkflowToolbar";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { StepEditor, StepEditorValues } from "@/components/workflow/StepEditor";
import { AddStepDialog } from "@/components/workflow/AddStepDialog";
import { createStep, updateStep, deleteStep, reorderSteps } from "@/lib/api/workflowStep";
import { api } from "@/lib/api";
import { Workflow, WorkflowStep } from "@/types/workflow";
import { Node, NodeChange } from "reactflow";
import { WorkflowStepNodeData } from "@/lib/workflow-flow";

// =========================================================
// Status badge styles (matches WorkflowCard / dashboard convention)
// =========================================================

const STATUS_STYLES: Record<Workflow["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-amber-100 text-amber-700",
};

export default function WorkflowBuilderPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params?.id;
  const router = useRouter();

  // Fetch state
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Editor state
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  // Save / execute state
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isStepSaving, setIsStepSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // =========================================================
  // Load workflow
  // =========================================================

  async function fetchWorkflow() {
    if (!workflowId) return;

    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await api.get(`/workflows/${workflowId}`);
      const loadedWorkflow = response.data.data.workflow as Workflow;

      // Defensive fallback: guarantee `steps` is always an array,
      // even if a future API response omits it.
      setWorkflow({
        ...loadedWorkflow,
        steps: loadedWorkflow.steps ?? [],
      });
    } catch {
      setFetchError("Couldn't load this workflow. It may not exist or you may not have access to it.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const selectedStep = workflow?.steps?.find((step) => step.id === selectedStepId) ?? null;

  // =========================================================
  // Node selection (derived from ReactFlow's own "select" changes,
  // since WorkflowCanvas doesn't expose a dedicated onNodeClick prop)
  // =========================================================

  function handleNodesChange(changes: NodeChange[]) {
    const selectChange = changes.find(
      (change): change is Extract<NodeChange, { type: "select" }> => change.type === "select"
    );

    if (selectChange) {
      setSelectedStepId(selectChange.selected ? selectChange.id : null);
    }
  }

  // =========================================================
  // Drag & drop reorder
  // Uses each node's horizontal (x) position to infer the new
  // left-to-right step order, then persists it via reorderSteps().
  // =========================================================

  async function handleNodeDragStop(
    _event: React.MouseEvent,
    _node: Node<WorkflowStepNodeData>,
    allNodes?: Node<WorkflowStepNodeData>[]
  ) {
    if (!workflow || !allNodes) return;

    // Sort all nodes by their horizontal x coordinate to find the new step order
    const sortedNodes = [...allNodes].sort((a, b) => a.position.x - b.position.x);
    const stepIds = sortedNodes.map((node) => node.id);

    setActionError(null);

    try {
      await reorderSteps(workflow.id, stepIds);
      await fetchWorkflow();
    } catch {
      setActionError("Couldn't save the new step order. Please try again.");
    }
  }

  // =========================================================
  // Toolbar actions
  // =========================================================

  function handleAddStepClick() {
    setIsAddDialogOpen(true);
  }

  // WorkflowCanvas has no exposed fitView/instance API, so both
  // actions remount the canvas, which re-derives layout + re-fits.
  function handleFitView() {
    setCanvasKey((key) => key + 1);
  }

  function handleAutoLayout() {
    setCanvasKey((key) => key + 1);
  }

  // =========================================================
  // Step mutations (persisted via Workflow Step API)
  // =========================================================

  async function handleCreateStep(values: { type: WorkflowStep["type"]; name: string }) {
    if (!workflow) return;

    setIsStepSaving(true);
    setActionError(null);

    try {
      await createStep(workflow.id, {
        name: values.name,
        type: values.type,
        config: {},
      });
      await fetchWorkflow();
      setIsAddDialogOpen(false);
    } catch {
      setActionError("Couldn't add the step. Please try again.");
    } finally {
      setIsStepSaving(false);
    }
  }

  async function handleSaveStep(values: StepEditorValues) {
    if (!workflow || !selectedStep) return;

    setIsStepSaving(true);
    setActionError(null);

    try {
      await updateStep(selectedStep.id, {
        name: values.name,
        type: values.type,
        config: values.config,
      });
      await fetchWorkflow();
    } catch {
      setActionError("Couldn't save the step. Please try again.");
    } finally {
      setIsStepSaving(false);
    }
  }

  async function handleDeleteStep() {
    if (!workflow || !selectedStep) return;

    setIsStepSaving(true);
    setActionError(null);

    try {
      await deleteStep(selectedStep.id);
      await fetchWorkflow();
      setSelectedStepId(null);
    } catch {
      setActionError("Couldn't delete the step. Please try again.");
    } finally {
      setIsStepSaving(false);
    }
  }

  // =========================================================
  // Save Workflow
  // NOTE: only title/description/status are persisted here - steps
  // are saved independently and immediately via the Workflow Step API.
  // =========================================================

  async function handleSaveWorkflow() {
    if (!workflow) return;

    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await api.put(`/workflows/${workflow.id}`, {
        title: workflow.title,
        description: workflow.description,
        status: workflow.status,
      });
      const updated = response.data.data.workflow as Workflow;

      setWorkflow((prev) =>
        prev
          ? {
              ...prev,
              title: updated.title,
              description: updated.description,
              status: updated.status,
              updatedAt: updated.updatedAt,
            }
          : prev
      );
      setActionMessage("Workflow saved.");
    } catch {
      setActionError("Couldn't save the workflow. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // =========================================================
  // Execute Workflow
  // =========================================================

  async function handleExecuteWorkflow() {
    if (!workflow) return;

    setIsExecuting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await api.post(`/executions/${workflow.id}`);
      const executionId = response.data?.data?.execution?.id;

      if (executionId) {
        router.push(`/dashboard/executions/${executionId}`);
      } else {
        setActionMessage(
          `Execution ${response.data.data.execution.status}`
        );
      }
    } catch {
      setActionError("Couldn't start execution. Please try again.");
    } finally {
      setIsExecuting(false);
    }
  }

  // =========================================================
  // Render
  // =========================================================

  

  return (
    
    <DashboardShell>
      {isLoading && (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
            <p className="text-sm">Loading workflow...</p>
          </div>
        </div>
      )}

      {!isLoading && fetchError && (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="max-w-sm rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">{fetchError}</p>
          </div>
        </div>
      )}

      {!isLoading && !fetchError && workflow && (
        <div className="flex h-[calc(100vh-4rem-3rem)] flex-col gap-4">
          {/* Header: title, status, Save / Execute */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-semibold text-gray-900">{workflow.title}</h1>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[workflow.status]}`}
                >
                  {workflow.status}
                </span>
              </div>
              {workflow.description && (
                <p className="mt-1 truncate text-sm text-gray-500">{workflow.description}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleSaveWorkflow}
                disabled={isSaving || isExecuting}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Workflow"}
              </button>
              <button
                type="button"
                onClick={handleExecuteWorkflow}
                disabled={isSaving || isExecuting}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {isExecuting ? "Executing..." : "Execute"}
              </button>
            </div>
          </div>

          {(actionError || actionMessage) && (
            <div
              className={`rounded-xl border p-3 text-sm font-medium ${
                actionError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {actionError ?? actionMessage}
            </div>
          )}

          {/* Toolbar */}
          <WorkflowToolbar
            onAddStep={handleAddStepClick}
            onFitView={handleFitView}
            onAutoLayout={handleAutoLayout}
          />

          {/* Canvas + Step editor */}
          <div className="flex min-h-0 flex-1 gap-4">
            <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <WorkflowCanvas
                key={canvasKey}
                workflow={workflow}
                onNodesChange={handleNodesChange}
                onNodeDragStop={handleNodeDragStop}
              />
            </div>

            <div className="w-96 shrink-0 overflow-y-auto">
              {selectedStep ? (
                <StepEditor
                  step={selectedStep}
                  onSave={handleSaveStep}
                  onDelete={handleDeleteStep}
                  isSaving={isStepSaving}
                />
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">
                  <div className="px-6 text-center">
                    <p className="text-sm font-medium text-gray-700">No step selected</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Select a step on the canvas to edit it.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AddStepDialog
        isOpen={isAddDialogOpen}
        onCancel={() => setIsAddDialogOpen(false)}
        onCreate={handleCreateStep}
      />
    </DashboardShell>
  );
}