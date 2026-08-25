import React from "react";
import { EdgeProps, getSmoothStepPath } from "reactflow";

export function AnimatedWorkflowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  animated,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <>
      {/* Base smooth path */}
      <path
        id={id}
        className={`react-flow__edge-path stroke-[2.5px] transition-colors duration-300 ${
          selected
            ? "stroke-brand-500"
            : animated
            ? "stroke-brand-400"
            : "stroke-slate-300"
        }`}
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />

      {/* Animated active pulse line overlay */}
      {animated && (
        <path
          d={edgePath}
          fill="none"
          stroke="#3457ff"
          strokeWidth="3.5"
          strokeDasharray="6 12"
          className="animate-flow-dash opacity-90 filter drop-shadow-[0_0_6px_rgba(52,87,255,0.6)]"
        />
      )}
    </>
  );
}
