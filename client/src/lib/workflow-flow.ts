import { Edge, Node } from "reactflow";
import { Workflow, WorkflowStep } from "@/types/workflow";

// =========================================================
// Layout constants
// =========================================================

export const NODE_TYPE = "workflowStep";
export const NODE_WIDTH = 288; // w-72
export const HORIZONTAL_GAP = 72; // clean spacing
export const HORIZONTAL_SPACING = NODE_WIDTH + HORIZONTAL_GAP; // 360px
export const START_X = 80;
export const START_Y = 120;

export const WORKFLOW_UI_CONFIG_KEY = "__ui";

export interface WorkflowStepCanvasPosition {
  x: number;
  y: number;
}

export function getStepCanvasPosition(step: WorkflowStep): WorkflowStepCanvasPosition | null {
  const config = step.config && typeof step.config === "object" && !Array.isArray(step.config)
    ? (step.config as Record<string, unknown>)
    : {};
  const ui = config[WORKFLOW_UI_CONFIG_KEY];
  if (!ui || typeof ui !== "object" || Array.isArray(ui)) return null;
  const position = (ui as Record<string, unknown>).position;
  if (!position || typeof position !== "object" || Array.isArray(position)) return null;
  const { x, y } = position as Record<string, unknown>;
  if (typeof x !== "number" || !Number.isFinite(x) || typeof y !== "number" || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
}

export function withStepCanvasPosition(
  config: Record<string, unknown> | null | undefined,
  position: WorkflowStepCanvasPosition | null
): Record<string, unknown> {
  const base = config && typeof config === "object" && !Array.isArray(config)
    ? { ...(config as Record<string, unknown>) }
    : {};
  const uiRaw = base[WORKFLOW_UI_CONFIG_KEY];
  const ui = uiRaw && typeof uiRaw === "object" && !Array.isArray(uiRaw)
    ? { ...(uiRaw as Record<string, unknown>) }
    : {};

  if (!position) {
    delete ui.position;
  } else {
    ui.position = { x: Math.round(position.x), y: Math.round(position.y) };
  }

  if (Object.keys(ui).length > 0) {
    base[WORKFLOW_UI_CONFIG_KEY] = ui;
  } else {
    delete base[WORKFLOW_UI_CONFIG_KEY];
  }

  return base;
}

// =========================================================
// Node data shape
// =========================================================

export interface WorkflowStepNodeData {
  step: WorkflowStep;
  status?: "COMPLETED" | "RUNNING" | "FAILED" | "PENDING";
  isActive?: boolean;
}

// =========================================================
// Build workflow nodes + edges with position preservation
// =========================================================

export function buildWorkflowFlow(
  workflow: Workflow,
  existingPositions: Record<string, { x: number; y: number }> = {},
  options?: { preferPersisted?: boolean }
): {
  nodes: Node<WorkflowStepNodeData>[];
  edges: Edge[];
  positions: Record<string, { x: number; y: number }>;
} {
  const orderedSteps = [...(workflow.steps ?? [])].sort(
    (a, b) => a.stepOrder - b.stepOrder
  );

  const positions: Record<string, { x: number; y: number }> = { ...existingPositions };
  if (options?.preferPersisted) {
    for (const step of orderedSteps) {
      const persisted = getStepCanvasPosition(step);
      if (persisted) {
        positions[step.id] = { ...persisted };
      }
    }
  }

  // Calculate highest X position among known nodes to smartly position newly added nodes
  let maxKnownX = START_X - HORIZONTAL_SPACING;
  Object.values(positions).forEach((pos) => {
    if (pos && typeof pos.x === "number" && pos.x > maxKnownX) {
      maxKnownX = pos.x;
    }
  });

  const nodes: Node<WorkflowStepNodeData>[] = orderedSteps.map((step, index) => {
    let nodePosition = positions[step.id];

    if (!nodePosition || typeof nodePosition.x !== "number" || typeof nodePosition.y !== "number") {
      const persisted = getStepCanvasPosition(step);
      if (persisted) {
        nodePosition = { ...persisted };
      }
    }

    if (!nodePosition || typeof nodePosition.x !== "number" || typeof nodePosition.y !== "number") {
      // If position doesn't exist yet, compute sequential default
      const x = index === 0 && maxKnownX < START_X
        ? START_X
        : maxKnownX >= START_X
        ? maxKnownX + HORIZONTAL_SPACING
        : START_X + index * HORIZONTAL_SPACING;

      const y = START_Y;
      nodePosition = { x, y };
    }

    positions[step.id] = { ...nodePosition };
    if (nodePosition.x > maxKnownX) {
      maxKnownX = nodePosition.x;
    }

    return {
      id: step.id,
      type: NODE_TYPE,
      position: { ...nodePosition },
      data: {
        step,
      },
      draggable: true,
      selectable: true,
    };
  });

  const edges: Edge[] = orderedSteps.slice(1).map((step, index) => {
    const previousStep = orderedSteps[index];

    return {
      id: `${previousStep.id}-${step.id}`,
      source: previousStep.id,
      target: step.id,
      animated: false,
      type: "animatedEdge",
    };
  });

  return {
    nodes,
    edges,
    positions,
  };
}