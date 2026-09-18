"use client";

import { useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MiniMap,
  Node,
  NodeChange,
  NodeTypes,
  OnEdgesChange,
  OnNodesChange,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  BackgroundVariant,
} from "reactflow";

import "reactflow/dist/style.css";

import WorkflowStepNode from "@/components/workflow/WorkflowStepNode";
import { AnimatedWorkflowEdge } from "@/components/workflow/AnimatedWorkflowEdge";
import {
  buildWorkflowFlow,
  WorkflowStepNodeData,
  START_X,
  START_Y,
  HORIZONTAL_SPACING,
} from "@/lib/workflow-flow";
import { Workflow } from "@/types/workflow";

// =========================================================
// Node & Edge Types
// =========================================================

const nodeTypes: NodeTypes = {
  workflowStep: WorkflowStepNode,
};

const edgeTypes = {
  animatedEdge: AnimatedWorkflowEdge,
  smoothstep: AnimatedWorkflowEdge,
  default: AnimatedWorkflowEdge,
};

// =========================================================
// Props
// =========================================================

interface WorkflowCanvasProps {
  workflow: Workflow;

  onNodeClick?: (
    event: React.MouseEvent,
    node: Node<WorkflowStepNodeData>
  ) => void;

  onNodeDragStop?: (
    event: React.MouseEvent,
    node: Node<WorkflowStepNodeData>,
    allNodes: Node<WorkflowStepNodeData>[]
  ) => void;

  onConnect?: (connection: Connection) => void;

  onNodesChange?: OnNodesChange;

  onEdgesChange?: OnEdgesChange;

  executingStepId?: string | null;

  onAutoLayoutRef?: (autoLayoutFn: () => void) => void;
}

// =========================================================
// WorkflowCanvasInner
// =========================================================

function WorkflowCanvasInner({
  workflow,
  onNodeClick,
  onNodeDragStop,
  onConnect,
  onNodesChange,
  onEdgesChange,
  executingStepId,
  onAutoLayoutRef,
}: WorkflowCanvasProps) {
  const { fitView } = useReactFlow();

  // Stable persistent node position map across the entire editing session
  const positionsMapRef = useRef<Record<string, { x: number; y: number }>>({});

  const { nodes: initialNodes, edges: initialEdges, positions: initialPositions } =
    buildWorkflowFlow(workflow, positionsMapRef.current);

  positionsMapRef.current = initialPositions;

  const [nodes, setNodes, internalNodesChange] =
    useNodesState<WorkflowStepNodeData>(initialNodes);

  const [edges, setEdges, internalEdgesChange] =
    useEdgesState(initialEdges);

  // =========================================================
  // Explicit Auto Layout handler
  // =========================================================

  const handleAutoLayout = useCallback(() => {
    const orderedSteps = [...(workflow.steps ?? [])].sort(
      (a, b) => a.stepOrder - b.stepOrder
    );

    const freshPositions: Record<string, { x: number; y: number }> = {};
    orderedSteps.forEach((step, index) => {
      freshPositions[step.id] = {
        x: START_X + index * HORIZONTAL_SPACING,
        y: START_Y,
      };
    });

    positionsMapRef.current = freshPositions;

    const { nodes: newNodes, edges: newEdges } = buildWorkflowFlow(
      workflow,
      freshPositions
    );

    setNodes(newNodes);
    setEdges(newEdges);

    setTimeout(() => {
      fitView({ padding: 0.25, duration: 400 });
    }, 50);
  }, [workflow, fitView, setNodes, setEdges]);

  // Expose autoLayout function to parent toolbar if requested
  useEffect(() => {
    if (onAutoLayoutRef) {
      onAutoLayoutRef(handleAutoLayout);
    }
  }, [handleAutoLayout, onAutoLayoutRef]);

  // =========================================================
  // Sync workflow data updates while strictly preserving positions
  // =========================================================

  useEffect(() => {
    // Build next nodes while keeping existing dragged coordinates intact
    const { nodes: nextNodes, edges: nextEdges, positions: updatedPositions } =
      buildWorkflowFlow(workflow, positionsMapRef.current);

    positionsMapRef.current = updatedPositions;

    // Apply active execution states if executingStepId is provided
    const updatedNodes = nextNodes.map((n) => {
      const isCurrentStep = n.id === executingStepId;
      return {
        ...n,
        data: {
          ...n.data,
          isActive: isCurrentStep,
          status: isCurrentStep ? ("RUNNING" as const) : undefined,
        },
      };
    });

    const updatedEdges = nextEdges.map((e) => ({
      ...e,
      type: "animatedEdge",
      animated: Boolean(
        executingStepId &&
          (e.source === executingStepId || e.target === executingStepId)
      ),
    }));

    setNodes(updatedNodes);
    setEdges(updatedEdges);
  }, [workflow, executingStepId, setNodes, setEdges]);

  // =========================================================
  // Node Drag Handlers (Instant Position Recording)
  // =========================================================

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Record any position change directly into our persistent coordinates map
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          positionsMapRef.current[change.id] = { ...change.position };
        }
      });

      internalNodesChange(changes);
      onNodesChange?.(changes);
    },
    [internalNodesChange, onNodesChange]
  );

  const handleNodeDragStop = useCallback(
    (
      event: React.MouseEvent,
      node: Node<WorkflowStepNodeData>
    ) => {
      // Permanently lock dropped coordinates in memory
      if (node?.position) {
        positionsMapRef.current[node.id] = { ...node.position };
      }

      onNodeDragStop?.(event, node, nodes);
    },
    [onNodeDragStop, nodes]
  );

  // =========================================================
  // Connect
  // =========================================================

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        addEdge({ ...connection, type: "animatedEdge" }, currentEdges)
      );

      onConnect?.(connection);
    },
    [setEdges, onConnect]
  );

  // =========================================================
  // Edge changes
  // =========================================================

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      internalEdgesChange(changes);
      onEdgesChange?.(changes);
    },
    [internalEdgesChange, onEdgesChange]
  );

  // =========================================================
  // Render
  // =========================================================

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      onNodeDragStop={handleNodeDragStop}
      nodesDraggable
      nodesConnectable
      elementsSelectable
      fitView
      fitViewOptions={{
        padding: 0.25,
        duration: 300,
      }}
      minZoom={0.2}
      maxZoom={2}
      attributionPosition="bottom-left"
      className="bg-dark-950"
    >
      <Background variant={BackgroundVariant.Dots} gap={28} size={1.5} color="#1e293b" />
      <Controls className="!bg-dark-900 !border-white/[0.08] !shadow-card !rounded-xl overflow-hidden" />
      <MiniMap
        nodeColor="#3b82f6"
        maskColor="rgba(6, 9, 14, 0.85)"
        style={{ width: 140, height: 90 }}
        className="!bg-dark-900 !border-white/[0.08] !rounded-xl !shadow-card overflow-hidden"
      />
    </ReactFlow>
  );
}

// =========================================================
// Provider wrapper
// =========================================================

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
export default WorkflowCanvas;
