"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Node } from "reactflow";
import { Play, Save, Loader2, Sparkles, Layers, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { WorkflowToolbar } from "@/components/workflow/WorkflowToolbar";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import {
  StepEditor,
  StepEditorValues,
} from "@/components/workflow/StepEditor";
import { AddStepDialog } from "@/components/workflow/AddStepDialog";
import {
  ExecuteWorkflowModal,
  RuntimeTriggerPayload,
} from "@/components/execution/ExecuteWorkflowModal";

import {
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
} from "@/lib/api/workflowStep";

import { api } from "@/lib/api";
import { Workflow, WorkflowStep } from "@/types/workflow";
import { WorkflowStepNodeData } from "@/lib/workflow-flow";

// =========================================================
// Status styles
// =========================================================

const STATUS_STYLES: Record<Workflow["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ARCHIVED: "bg-amber-50 text-amber-700 border-amber-200",
};

// =========================================================
// Page
// =========================================================

export default function WorkflowBuilderPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params?.id;

  const router = useRouter();

  // =========================================================
  // Workflow state
  // =========================================================

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // =========================================================
  // Editor state
  // =========================================================

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // =========================================================
  // Action state
  // =========================================================

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

    if (!workflow) {
      setIsLoading(true);
    }
    setFetchError(null);

    try {
      const response = await api.get(`/workflows/${workflowId}`);
      const loadedWorkflow = response.data.data.workflow as Workflow;
      setWorkflow({
        ...loadedWorkflow,
        steps: loadedWorkflow.steps ?? [],
      });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        return;
      }
      setFetchError(
        "Couldn't load this workflow. It may not exist or you may not have access to it."
      );
    } finally {
      if (!workflow) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  // Selected step
  const selectedStep =
    workflow?.steps?.find(
      (step) => step.id === selectedStepId
    ) ?? null;

  // Node click
  function handleNodeClick(
    _event: React.MouseEvent,
    node: Node<WorkflowStepNodeData>
  ) {
    setSelectedStepId(node.id);
    setActionError(null);
    setActionMessage(null);
  }

  // Node position drag stop
  function handleNodeDragStop(
    _event: React.MouseEvent,
    _node: Node<WorkflowStepNodeData>,
    _allNodes?: Node<WorkflowStepNodeData>[]
  ) {
    // Keep dropped node position in memory without triggering network re-renders or coordinate wipeouts
    setActionError(null);
  }

  const autoLayoutRef = useRef<(() => void) | null>(null);

  // Toolbar
  function handleAddStepClick() {
    setIsAddDialogOpen(true);
  }

  function handleFitView() {
    // Trigger autoLayout or fit view cleanly
    if (autoLayoutRef.current) {
      autoLayoutRef.current();
    }
  }

  function handleAutoLayout() {
    if (autoLayoutRef.current) {
      autoLayoutRef.current();
      setActionMessage("Workflow layout arranged.");
      setTimeout(() => setActionMessage(null), 2500);
    }
  }

  // Create step
  async function handleCreateStep(values: {
    type: WorkflowStep["type"];
    name: string;
  }) {
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
      setActionError(
        "Couldn't add the step. Please try again."
      );
    } finally {
      setIsStepSaving(false);
    }
  }

  // Save step
  async function handleSaveStep(
    values: StepEditorValues
  ) {
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
      setActionError(
        "Couldn't save the step. Please try again."
      );
    } finally {
      setIsStepSaving(false);
    }
  }

  // Delete step
  async function handleDeleteStep() {
    if (!workflow || !selectedStep) return;

    setIsStepSaving(true);
    setActionError(null);

    try {
      await deleteStep(selectedStep.id);
      setSelectedStepId(null);
      await fetchWorkflow();
    } catch {
      setActionError(
        "Couldn't delete the step. Please try again."
      );
    } finally {
      setIsStepSaving(false);
    }
  }

  // Save workflow
  async function handleSaveWorkflow() {
    if (!workflow) return;

    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await api.put(
        `/workflows/${workflow.id}`,
        {
          title: workflow.title,
          description: workflow.description,
          status: workflow.status,
        }
      );

      const updated =
        response.data.data.workflow as Workflow;

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

      setActionMessage("Workflow configuration saved.");
    } catch {
      setActionError(
        "Couldn't save the workflow. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);

  // Extract initial values from saved TRIGGER step config if available
  const initialExecutionValues = useMemo<Partial<RuntimeTriggerPayload>>(() => {
    const triggerStep = workflow?.steps?.find((s) => s.type === "TRIGGER");
    const triggerConfig = (triggerStep?.config as Record<string, unknown>) ?? {};
    return {
      employee_name:
        typeof triggerConfig.employee_name === "string"
          ? triggerConfig.employee_name
          : typeof triggerConfig.name === "string"
          ? triggerConfig.name
          : "",
      employee_email:
        typeof triggerConfig.employee_email === "string"
          ? triggerConfig.employee_email
          : typeof triggerConfig.email === "string"
          ? triggerConfig.email
          : "",
      job_title:
        typeof triggerConfig.job_title === "string"
          ? triggerConfig.job_title
          : "",
      department:
        typeof triggerConfig.department === "string"
          ? triggerConfig.department
          : "",
      manager_name:
        typeof triggerConfig.manager_name === "string"
          ? triggerConfig.manager_name
          : typeof triggerConfig.manager === "string"
          ? triggerConfig.manager
          : typeof triggerConfig.reporting_manager === "string"
          ? triggerConfig.reporting_manager
          : "",
      manager_email:
        typeof triggerConfig.manager_email === "string"
          ? triggerConfig.manager_email
          : "",
      start_date:
        typeof triggerConfig.start_date === "string"
          ? triggerConfig.start_date
          : "",
      company_name:
        typeof triggerConfig.company_name === "string"
          ? triggerConfig.company_name
          : "",
      company_address:
        typeof triggerConfig.company_address === "string"
          ? triggerConfig.company_address
          : "",
      company_phone:
        typeof triggerConfig.company_phone === "string"
          ? triggerConfig.company_phone
          : "",
      event:
        typeof triggerConfig.event === "string"
          ? triggerConfig.event
          : "employee_added",
    };
  }, [workflow?.steps]);

  // Execute workflow
  function handleOpenExecuteModal() {
    if (!workflow) return;
    setActionError(null);
    setActionMessage(null);
    setIsExecuteModalOpen(true);
  }

  async function handleRunExecution(payload: RuntimeTriggerPayload) {
    if (!workflow) return;

    setIsExecuting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await api.post(
        `/executions/${workflow.id}`,
        payload
      );

      if (response.data?.success === false) {
        throw new Error(response.data?.message || "Workflow execution failed on server.");
      }

      const execution = response.data?.data?.execution;
      if (execution?.status === "FAILED") {
        throw new Error("Workflow execution failed on server.");
      }

      setActionMessage("Workflow execution completed successfully.");
      return response.data;
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message || (err as { message?: string })?.message || "Couldn't start execution. Please try again.";
      setActionError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <DashboardShell>
      {/* Initial workflow loading */}
      {isLoading && (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="text-xs font-semibold">
              Loading workflow pipeline...
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {!isLoading && fetchError && (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="max-w-sm rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-rose-700">
              {fetchError}
            </p>
          </div>
        </div>
      )}

      {/* Main Builder Canvas & Workspace */}
      {!isLoading && !fetchError && workflow && (
        <div className="flex h-[calc(100vh-4rem-3rem)] lg:h-[calc(100vh-4rem-4rem)] w-full min-w-0 flex-col gap-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <Link
                  href="/dashboard/workflows"
                  className="rounded-xl p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Back to workflows"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>

                <h1 className="truncate text-lg font-bold text-slate-900">
                  {workflow.title}
                </h1>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[workflow.status]}`}
                >
                  {workflow.status}
                </span>
              </div>

              {workflow.description && (
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {workflow.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleSaveWorkflow}
                disabled={isSaving || isExecuting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5 text-slate-500" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenExecuteModal}
                disabled={isSaving || isExecuting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Execute Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Messages */}
          {(actionError || actionMessage) && (
            <div
              className={`rounded-xl border p-3 text-xs font-semibold animate-fade-in ${
                actionError
                  ? "border-rose-200 bg-rose-50 text-rose-700"
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

          {/* Canvas + editor */}
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row gap-4 w-full min-w-0 overflow-hidden">
            <div className="relative min-w-0 flex-1 min-h-[360px] lg:min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-dark-950 shadow-sm">
              <WorkflowCanvas
                workflow={workflow}
                onNodeClick={handleNodeClick}
                onNodeDragStop={handleNodeDragStop}
                onAutoLayoutRef={(fn) => {
                  autoLayoutRef.current = fn;
                }}
              />
            </div>

            {/* Editor */}
            <div className="w-full lg:w-80 xl:w-96 shrink-0 overflow-y-auto max-h-[420px] lg:max-h-full">
              {selectedStep ? (
                <StepEditor
                  key={selectedStep.id}
                  step={selectedStep}
                  onSave={handleSaveStep}
                  onDelete={handleDeleteStep}
                  isSaving={isStepSaving}
                />
              ) : (
                <div className="flex h-full min-h-[200px] lg:min-h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 shadow-sm text-center">
                  <div>
                    <Layers className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-float" />
                    <p className="text-xs font-bold text-slate-800">
                      No step selected
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 max-w-xs leading-relaxed">
                      Click any node on the workflow canvas to configure its properties.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add step dialog */}
      <AddStepDialog
        isOpen={isAddDialogOpen}
        onCancel={() => setIsAddDialogOpen(false)}
        onCreate={handleCreateStep}
      />

      {/* Execute workflow runtime modal */}
      <ExecuteWorkflowModal
        isOpen={isExecuteModalOpen}
        onClose={() => setIsExecuteModalOpen(false)}
        onExecute={handleRunExecution}
        initialValues={initialExecutionValues}
        workflowTitle={workflow?.title}
        isExecuting={isExecuting}
        executionError={actionError}
      />
    </DashboardShell>
  );
}