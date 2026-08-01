import { Handle, NodeProps, Position } from "reactflow";

import { WorkflowStepNodeData } from "@/lib/workflow-flow";
import { WorkflowStepType } from "@/types/workflow";

// =========================================================
// Step type → visual style map
// =========================================================

const STEP_TYPE_STYLES: Record<
  WorkflowStepType,
  {
    badgeBg: string;
    badgeText: string;
    ring: string;
    dot: string;
  }
> = {
  TRIGGER: {
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
  },
  AI: {
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    ring: "ring-purple-200",
    dot: "bg-purple-500",
  },
  EMAIL: {
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
  },
  DELAY: {
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    ring: "ring-orange-200",
    dot: "bg-orange-500",
  },
  WEBHOOK: {
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-700",
    ring: "ring-pink-200",
    dot: "bg-pink-500",
  },
};

// =========================================================
// WorkflowStepNode
// =========================================================

function WorkflowStepNode({
  data,
}: NodeProps<WorkflowStepNodeData>) {
  const { step } = data;
  const style = STEP_TYPE_STYLES[step.type];

  return (
    <div
      className={`w-56 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ${style.ring}`}
    >
      {/* Incoming Connection */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-2.5 !w-2.5 !border-2 !border-white ${style.dot}`}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
          {step.stepOrder}
        </span>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.badgeBg} ${style.badgeText}`}
        >
          {step.type}
        </span>
      </div>

      {/* Step Name */}
      <p
        className="mt-3 truncate text-sm font-semibold text-gray-900"
        title={step.name}
      >
        {step.name}
      </p>

      {/* Outgoing Connection */}
      <Handle
        type="source"
        position={Position.Right}
        className={`!h-2.5 !w-2.5 !border-2 !border-white ${style.dot}`}
      />
    </div>
  );
}

export default WorkflowStepNode;