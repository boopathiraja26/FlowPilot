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
            ? "stroke-blue-400"
            : animated
            ? "stroke-blue-500"
            : "stroke-slate-700"
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
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeDasharray="6 12"
          className="animate-flow-dash opacity-90 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
        />
      )}
    </>
  );
}
