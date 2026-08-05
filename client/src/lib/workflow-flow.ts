import { Edge, Node } from "reactflow";

import { Workflow, WorkflowStep } from "@/types/workflow";

// =========================================================
// Layout constants
// =========================================================

const NODE_TYPE = "workflowStep";
const HORIZONTAL_SPACING = 260;
const NODE_Y_POSITION = 0;

// =========================================================
// Node data shape (consumed by WorkflowStepNode)
// =========================================================

export interface WorkflowStepNodeData {
  step: WorkflowStep;
}

// =========================================================
// buildWorkflowFlow
// =========================================================

export function buildWorkflowFlow(workflow: Workflow): {
  nodes: Node<WorkflowStepNodeData>[];
  edges: Edge[];
} {
  const orderedSteps = [...workflow.steps].sort((a, b) => a.stepOrder - b.stepOrder);

  const nodes: Node<WorkflowStepNodeData>[] = orderedSteps.map((step, index) => ({
    id: step.id,
    type: NODE_TYPE,
    position: {
      x: index * HORIZONTAL_SPACING,
      y: NODE_Y_POSITION,
    },
    data: { step },
    draggable: true,
    selectable: true,
  }));

  const edges: Edge[] = orderedSteps.slice(1).map((step, index) => {
    const previousStep = orderedSteps[index];

    return {
      id: `${previousStep.id}-${step.id}`,
      source: previousStep.id,
      target: step.id,
      animated: false,
      type: "smoothstep",
    };
  });

  return { nodes, edges };
}