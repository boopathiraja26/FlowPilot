import { WorkflowStep } from "@/types/workflow";
import { NewStepValues } from "@/components/workflow/AddStepDialog";
import { StepEditorValues } from "@/components/workflow/StepEditor";

// =========================================================
// Generate temporary client ID
// =========================================================

function generateTempId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// =========================================================
// appendStep
// Adds a new step to the end of the list.
// Temporary IDs are used until the backend Workflow Step API
// persists the step and returns the real database ID.
// =========================================================

export function appendStep(
  steps: WorkflowStep[],
  workflowId: string,
  values: NewStepValues
): WorkflowStep[] {
  const now = new Date().toISOString();

  const newStep: WorkflowStep = {
    id: generateTempId(),
    workflowId,
    stepOrder: steps.length + 1,
    type: values.type,
    name: values.name,
    config: {},
    createdAt: now,
    updatedAt: now,
  };

  return [...steps, newStep];
}

// =========================================================
// applyStepEdit
// Updates editable fields.
// Description is stored inside config because WorkflowStep
// has no dedicated description column.
// =========================================================

export function applyStepEdit(
  steps: WorkflowStep[],
  stepId: string,
  values: StepEditorValues
): WorkflowStep[] {
  return steps.map((step) =>
    step.id === stepId
      ? {
          ...step,
          name: values.name,
          type: values.type,
          config: {
            ...values.config,
            description: values.description,
          },
          updatedAt: new Date().toISOString(),
        }
      : step
  );
}

// =========================================================
// removeStepAndReorder
// Removes a step and recalculates sequential stepOrder values.
// =========================================================

export function removeStepAndReorder(
  steps: WorkflowStep[],
  stepId: string
): WorkflowStep[] {
  return steps
    .filter((step) => step.id !== stepId)
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((step, index) => ({
      ...step,
      stepOrder: index + 1,
    }));
}