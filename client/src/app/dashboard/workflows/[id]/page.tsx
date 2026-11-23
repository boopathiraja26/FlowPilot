"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Node } from "reactflow";
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  Loader2,
  Play,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { WorkflowToolbar } from "@/components/workflow/WorkflowToolbar";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { StepEditor, StepEditorValues } from "@/components/workflow/StepEditor";
import { AddStepDialog } from "@/components/workflow/AddStepDialog";
import { ExecuteWorkflowModal, RuntimeTriggerPayload } from "@/components/execution/ExecuteWorkflowModal";

import { createStep, updateStep, deleteStep, reorderSteps } from "@/lib/api/workflowStep";
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

function generateClientWebhookSecret(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function sanitizeDuplicatedConfig(step: WorkflowStep): Record<string, unknown> {
  const raw = step.config && typeof step.config === "object" && !Array.isArray(step.config)
    ? (JSON.parse(JSON.stringify(step.config)) as Record<string, unknown>)
    : {};

  if (step.type === "TRIGGER") {
    const mode = typeof raw.triggerMode === "string" ? raw.triggerMode.toLowerCase() : (typeof raw.trigger_type === "string" ? String(raw.trigger_type).toLowerCase() : "manual");
    const isWebhook = mode === "webhook" || mode === "incoming_webhook";
    if (isWebhook) {
      raw.triggerMode = "webhook";
      const secret = typeof raw.webhookSecret === "string" ? raw.webhookSecret : (typeof raw.webhook_secret === "string" ? raw.webhook_secret : "");
      if (!secret || secret === "[REDACTED_WEBHOOK_SECRET]" || secret.trim().length < 16) {
        raw.webhookSecret = generateClientWebhookSecret();
      } else {
        raw.webhookSecret = secret;
      }
      delete (raw as any).webhook_secret;
    }
  }

  return raw;
}

// =========================================================
// Page
// =========================================================

export default function WorkflowBuilderPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params?.id;

  // =========================================================
  // Workflow state
  // =========================================================

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Editable workflow details (advanced builder)
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  // =========================================================
  // Editor state
  // =========================================================

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);

  // =========================================================
  // Action state
  // =========================================================

  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isStepSaving, setIsStepSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isDuplicatingStep, setIsDuplicatingStep] = useState(false);
  const [isTogglingActivation, setIsTogglingActivation] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const autoLayoutRef = useRef<(() => void) | null>(null);
  const fitViewRef = useRef<(() => void) | null>(null);

  // =========================================================
  // Load workflow
  // =========================================================

  async function fetchWorkflow(options?: { preserveSelection?: boolean }) {
    if (!workflowId) return;

    if (!workflow) {
      setIsLoading(true);
    }
    setFetchError(null);

    try {
      const response = await api.get(`/workflows/${workflowId}`);
      const loadedWorkflow = response.data.data.workflow as Workflow;
      const normalized: Workflow = {
        ...loadedWorkflow,
        steps: [...(loadedWorkflow.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder),
      };
      setWorkflow(normalized);
      setDraftTitle(normalized.title ?? "");
      setDraftDescription(normalized.description ?? "");
      if (options?.preserveSelection && selectedStepId) {
        const stillExists = normalized.steps.some((s) => s.id === selectedStepId);
        if (!stillExists) setSelectedStepId(null);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        return;
      }
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

  // Selected step
  const orderedSteps = useMemo(
    () => [...(workflow?.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder),
    [workflow?.steps]
  );

  const selectedStepIndex = selectedStepId ? orderedSteps.findIndex((step) => step.id === selectedStepId) : -1;
  const selectedStep = selectedStepIndex >= 0 ? orderedSteps[selectedStepIndex] : null;

  useEffect(() => {
    if (selectedStepId && selectedStepIndex < 0) {
      setSelectedStepId(null);
    }
  }, [selectedStepId, selectedStepIndex]);

  // Node click
  function handleNodeClick(_event: React.MouseEvent, node: Node<WorkflowStepNodeData>) {
    setSelectedStepId(node.id);
    setActionError(null);
    setActionMessage(null);
  }

  function handleNodeDragStop(_event: React.MouseEvent, _node: Node<WorkflowStepNodeData>, _allNodes?: Node<WorkflowStepNodeData>[]) {
    setActionError(null);
  }

  // Toolbar
  function handleAddStepClick() {
    setIsAddDialogOpen(true);
  }

  function handleFitView() {
    fitViewRef.current?.();
  }

  function handleAutoLayout() {
    if (autoLayoutRef.current) {
      autoLayoutRef.current();
      setActionMessage("Workflow layout arranged.");
      setTimeout(() => setActionMessage(null), 2500);
    }
  }

  // Create step
  async function handleCreateStep(values: { type: WorkflowStep["type"]; name: string }) {
    if (!workflow) return;

    setIsStepSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const created = await createStep(workflow.id, {
        name: values.name,
        type: values.type,
        config: {},
      });

      await fetchWorkflow({ preserveSelection: true });
      if (created?.id) setSelectedStepId(created.id);
      setIsAddDialogOpen(false);
      setActionMessage("Step added to workflow.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Couldn't add the step. Please try again.");
    } finally {
      setIsStepSaving(false);
    }
  }

  // Save step
  async function handleSaveStep(values: StepEditorValues) {
    if (!workflow || !selectedStep) return;

    setIsStepSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await updateStep(selectedStep.id, {
        name: values.name,
        type: values.type,
        config: values.config,
      });

      await fetchWorkflow({ preserveSelection: true });
      setActionMessage("Step changes saved.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Couldn't save the step. Please try again.");
    } finally {
      setIsStepSaving(false);
    }
  }

  // Delete step
  async function handleDeleteStep() {
    if (!workflow || !selectedStep) return;

    const confirmed = window.confirm(`Delete step “${selectedStep.name}”? This cannot be undone.`);
    if (!confirmed) return;

    setIsStepSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await deleteStep(selectedStep.id);
      setSelectedStepId(null);
      await fetchWorkflow({ preserveSelection: true });
      setActionMessage("Step deleted.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Couldn't delete the step. Please try again.");
    } finally {
      setIsStepSaving(false);
    }
  }

  async function handleDuplicateStep() {
    if (!workflow || !selectedStep) return;

    setIsDuplicatingStep(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const created = await createStep(workflow.id, {
        name: `${selectedStep.name} (Copy)`.slice(0, 120),
        type: selectedStep.type,
        config: sanitizeDuplicatedConfig(selectedStep),
      });
      await fetchWorkflow({ preserveSelection: true });
      if (created?.id) setSelectedStepId(created.id);
      setActionMessage("Step duplicated.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Couldn't duplicate the step. Please try again.");
    } finally {
      setIsDuplicatingStep(false);
    }
  }

  async function handleMoveStep(direction: "left" | "right") {
    if (!workflow || !selectedStep || selectedStepIndex < 0) return;
    const targetIndex = direction === "left" ? selectedStepIndex - 1 : selectedStepIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedSteps.length) return;

    const nextOrder = [...orderedSteps];
    const [moved] = nextOrder.splice(selectedStepIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);

    setIsReordering(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await reorderSteps(workflow.id, nextOrder.map((s) => s.id));
      await fetchWorkflow({ preserveSelection: true });
      setActionMessage(direction === "left" ? "Step moved earlier in the sequence." : "Step moved later in the sequence.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Couldn't reorder steps. Please try again.");
    } finally {
      setIsReordering(false);
    }
  }

  function syncWorkflowDetailsDraft(next: Partial<Workflow>) {
    setWorkflow((prev) => (prev ? { ...prev, ...next } : prev));
  }

  // Save workflow
  async function handleSaveWorkflow() {
    if (!workflow) return;

    const title = draftTitle.trim();
    if (!title) {
      setActionError("Workflow title is required.");
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await api.put(`/workflows/${workflow.id}`, {
        title,
        description: draftDescription.trim() || null,
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
      setDraftTitle(updated.title ?? title);
      setDraftDescription(updated.description ?? "");

      setActionMessage("Workflow details saved.");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Couldn't save the workflow. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActivation() {
    if (!workflow) return;
    setIsTogglingActivation(true);
    setActionError(null);
    setActionMessage(null);
    const shouldActivate = workflow.status !== "ACTIVE";
    try {
      const endpoint = shouldActivate ? "activate" : "deactivate";
      const response = await api.post(`/workflows/${workflow.id}/${endpoint}`);
      const updated = response.data.data.workflow as Workflow;
      setWorkflow((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status,
              updatedAt: updated.updatedAt ?? prev.updatedAt,
            }
          : prev
      );
      setActionMessage(shouldActivate ? "Workflow activated." : "Workflow deactivated.");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Couldn't update workflow activation status.";
      setActionError(message);
    } finally {
      setIsTogglingActivation(false);
    }
  }

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
      job_title: typeof triggerConfig.job_title === "string" ? triggerConfig.job_title : "",
      department: typeof triggerConfig.department === "string" ? triggerConfig.department : "",
      manager_name:
        typeof triggerConfig.manager_name === "string"
          ? triggerConfig.manager_name
          : typeof triggerConfig.manager === "string"
          ? triggerConfig.manager
          : typeof triggerConfig.reporting_manager === "string"
          ? triggerConfig.reporting_manager
          : "",
      manager_email: typeof triggerConfig.manager_email === "string" ? triggerConfig.manager_email : "",
      start_date: typeof triggerConfig.start_date === "string" ? triggerConfig.start_date : "",
      company_name: typeof triggerConfig.company_name === "string" ? triggerConfig.company_name : "",
      company_address: typeof triggerConfig.company_address === "string" ? triggerConfig.company_address : "",
      company_phone: typeof triggerConfig.company_phone === "string" ? triggerConfig.company_phone : "",
      event: typeof triggerConfig.event === "string" ? triggerConfig.event : "employee_added",
    };
  }, [workflow?.steps]);

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
      const response = await api.post(`/executions/${workflow.id}`, payload);

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
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Couldn't start execution. Please try again.";
      setActionError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsExecuting(false);
    }
  }

  const isBusy = isSaving || isExecuting || isTogglingActivation || isStepSaving || isReordering || isDuplicatingStep;

  return (
    <DashboardShell contentClassName="mx-auto w-full max-w-none px-4 py-4 sm:px-6 lg:px-8" mainClassName="flex flex-col">
      {/* Initial workflow loading */}
      {isLoading && (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="text-xs font-semibold">Loading workflow pipeline...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!isLoading && fetchError && (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="max-w-sm rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-rose-700">{fetchError}</p>
            <button type="button" onClick={() => fetchWorkflow()} className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Builder Canvas & Workspace */}
      {!isLoading && !fetchError && workflow && (
        <div className="flex min-h-[calc(100vh-4rem-3rem)] w-full min-w-0 flex-col gap-4 overflow-hidden lg:h-[calc(100vh-4rem-4rem)]">
          {/* Header */}
          <div className="shrink-0 border-b border-slate-200 pb-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link href="/dashboard/workflows" className="rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" title="Back to workflows">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[workflow.status]}`}>
                    {workflow.status}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {orderedSteps.length} step{orderedSteps.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Workflow title</label>
                    <input
                      value={draftTitle}
                      onChange={(e) => { setDraftTitle(e.target.value); syncWorkflowDetailsDraft({ title: e.target.value }); }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus-ring"
                      placeholder="Workflow title"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description</label>
                    <input
                      value={draftDescription}
                      onChange={(e) => { setDraftDescription(e.target.value); syncWorkflowDetailsDraft({ description: e.target.value || null }); }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-ring"
                      placeholder="Describe what this workflow does"
                    />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveWorkflow}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5 text-slate-500" />
                  <span>{isSaving ? "Saving..." : "Save details"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleActivation}
                  disabled={isBusy}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                    workflow.status === "ACTIVE"
                      ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {isTogglingActivation ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : workflow.status === "ACTIVE" ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Activate</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenExecuteModal}
                  disabled={isBusy}
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
                      <span>Execute pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          {(actionError || actionMessage) && (
            <div className={`shrink-0 rounded-xl border p-3 text-xs font-semibold ${actionError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {actionError ?? actionMessage}
            </div>
          )}

          {/* Toolbar */}
          <div className="shrink-0">
            <WorkflowToolbar onAddStep={handleAddStepClick} onFitView={handleFitView} onAutoLayout={handleAutoLayout} />
          </div>

          {/* Canvas + editor */}
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
            <div className="relative min-h-[360px] min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-dark-950 shadow-sm lg:min-h-0">
              <WorkflowCanvas
                workflow={workflow}
                onNodeClick={handleNodeClick}
                onNodeDragStop={handleNodeDragStop}
                onAutoLayoutRef={(fn) => { autoLayoutRef.current = fn; }}
                onFitViewRef={(fn) => { fitViewRef.current = fn; }}
              />
            </div>

            {/* Editor */}
            <div className="flex w-full shrink-0 flex-col gap-3 overflow-hidden lg:max-h-full lg:w-96 xl:w-[26rem]">
              {selectedStep ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Selected step</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{selectedStep.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">Position {selectedStepIndex + 1} of {orderedSteps.length} · {selectedStep.type}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        <ArrowLeftRight className="mr-1 h-3 w-3" /> Sequence
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => handleMoveStep("left")} disabled={isBusy || selectedStepIndex <= 0} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                        <ChevronLeft className="h-3.5 w-3.5" /> Move earlier
                      </button>
                      <button type="button" onClick={() => handleMoveStep("right")} disabled={isBusy || selectedStepIndex < 0 || selectedStepIndex >= orderedSteps.length - 1} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                        Move later <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={handleDuplicateStep} disabled={isBusy} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                        <Copy className="h-3.5 w-3.5" /> {isDuplicatingStep ? "Duplicating..." : "Duplicate step"}
                      </button>
                      <button type="button" onClick={handleDeleteStep} disabled={isBusy} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" /> Delete step
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <StepEditor
                      key={selectedStep.id}
                      step={selectedStep}
                      onSave={handleSaveStep}
                      onDelete={handleDeleteStep}
                      isSaving={isStepSaving}
                    />
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm lg:min-h-full">
                  <div>
                    <Layers className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-800">No step selected</p>
                    <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                      Select a node on the canvas to configure it, reorder steps, duplicate, or run the workflow with real backend execution.
                    </p>
                    <button type="button" onClick={handleAddStepClick} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                      <Plus className="h-3.5 w-3.5" /> Add step
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add step dialog */}
      <AddStepDialog isOpen={isAddDialogOpen} onCancel={() => setIsAddDialogOpen(false)} onCreate={handleCreateStep} />

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