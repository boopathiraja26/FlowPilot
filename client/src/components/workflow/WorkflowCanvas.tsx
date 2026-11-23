"use client";

import { useCallback, useEffect, useRef } from "react";
import ReactFlow, {
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

  onPositionsChange?: (positions: Record<string, { x: number; y: number }>) => void;

  onConnect?: (connection: Connection) => void;
  onInvalidConnection?: (message: string) => void;

  onNodesChange?: OnNodesChange;

  onEdgesChange?: OnEdgesChange;

  executingStepId?: string | null;

  onAutoLayoutRef?: (autoLayoutFn: () => void) => void;
  onFitViewRef?: (fitViewFn: () => void) => void;
}

// =========================================================
// WorkflowCanvasInner
// =========================================================

function WorkflowCanvasInner({
  workflow,
  onNodeClick,
  onNodeDragStop,
  onPositionsChange,
  onConnect,
  onInvalidConnection,
  onNodesChange,
  onEdgesChange,
  executingStepId,
  onAutoLayoutRef,
  onFitViewRef,
}: WorkflowCanvasProps) {
  const { fitView } = useReactFlow();

  // Stable persistent node position map across the entire editing session
  const positionsMapRef = useRef<Record<string, { x: number; y: number }>>({});
  const onPositionsChangeRef = useRef(onPositionsChange);
  const onInvalidConnectionRef = useRef(onInvalidConnection);
  const lastEmittedPositionsSignatureRef = useRef<string>("");

  useEffect(() => {
    onPositionsChangeRef.current = onPositionsChange;
  }, [onPositionsChange]);

  useEffect(() => {
    onInvalidConnectionRef.current = onInvalidConnection;
  }, [onInvalidConnection]);

  const emitPositionsIfChanged = useCallback((positions: Record<string, { x: number; y: number }>) => {
    const signature = JSON.stringify(
      Object.keys(positions)
        .sort()
        .map((id) => [id, Math.round(positions[id]?.x ?? 0), Math.round(positions[id]?.y ?? 0)])
    );
    if (signature === lastEmittedPositionsSignatureRef.current) return;
    lastEmittedPositionsSignatureRef.current = signature;
    onPositionsChangeRef.current?.({ ...positions });
  }, []);

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
    emitPositionsIfChanged({ ...freshPositions });

    setTimeout(() => {
      fitView({ padding: 0.25, duration: 400 });
    }, 50);
  }, [workflow, fitView, setNodes, setEdges, emitPositionsIfChanged]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.25, duration: 300 });
  }, [fitView]);

  // Expose autoLayout and fitView functions to parent toolbar if requested
  useEffect(() => {
    if (onAutoLayoutRef) {
      onAutoLayoutRef(handleAutoLayout);
    }
  }, [handleAutoLayout, onAutoLayoutRef]);

  useEffect(() => {
    if (onFitViewRef) {
      onFitViewRef(handleFitView);
    }
  }, [handleFitView, onFitViewRef]);

  // =========================================================
  // Sync workflow data updates while strictly preserving positions
  // =========================================================

  useEffect(() => {
    // Prefer persisted positions when workflow data refreshes (e.g. after save/reload)
    // while keeping in-session placement for nodes not yet persisted.
    const { nodes: nextNodes, edges: nextEdges, positions: updatedPositions } =
      buildWorkflowFlow(workflow, positionsMapRef.current, { preferPersisted: true });

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

    // Emit only when positions actually changed to avoid sync loops with parent state updates.
    emitPositionsIfChanged({ ...updatedPositions });
  }, [workflow, executingStepId, setNodes, setEdges, emitPositionsIfChanged]);

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
      emitPositionsIfChanged({ ...positionsMapRef.current });
      onNodeDragStop?.(event, node, nodes);
    },
    [onNodeDragStop, nodes, emitPositionsIfChanged]
  );

  // =========================================================
  // Connect / edge changes (sequential engine: connections are derived from step order)
  // =========================================================

  const handleConnect = useCallback(
    (connection: Connection) => {
      const orderedIds = [...(workflow.steps ?? [])]
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map((s) => s.id);
      const isAdjacentInOrder = Boolean(
        connection.source &&
          connection.target &&
          orderedIds.some((id, i) => id === connection.source && orderedIds[i + 1] === connection.target)
      );

      if (!isAdjacentInOrder) {
        onInvalidConnectionRef.current?.(
          "Invalid connection. FlowPilot executes steps sequentially, so branching and cycles are not supported. Use reorder controls to change execution order."
        );
        return;
      }

      // Adjacent linear connection already represented by derived edges/order.
      onConnect?.(connection);
    },
    [workflow.steps, onConnect]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Ignore manual edge removals/additions in the canvas UI; edges are synchronized
      // from persisted sequential step order to match backend execution.
      const ignored = changes.every((change) => change.type === "remove" || change.type === "add");
      if (ignored) {
        if (changes.some((change) => change.type === "remove")) {
          onInvalidConnectionRef.current?.(
            "Connections are synchronized with execution order. Reorder or delete steps to change the sequence."
          );
        }
        return;
      }

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
      deleteKeyCode={null}
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
