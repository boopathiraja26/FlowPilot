"use client";

import { useCallback, useEffect } from "react";
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
  BackgroundVariant,
} from "reactflow";

import "reactflow/dist/style.css";

import WorkflowStepNode from "@/components/workflow/WorkflowStepNode";
import { AnimatedWorkflowEdge } from "@/components/workflow/AnimatedWorkflowEdge";
import {
  buildWorkflowFlow,
  WorkflowStepNodeData,
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
}: WorkflowCanvasProps) {
  const { nodes: initialNodes, edges: initialEdges } =
    buildWorkflowFlow(workflow);

  const [nodes, setNodes, internalNodesChange] =
    useNodesState<WorkflowStepNodeData>(initialNodes);

  const [edges, setEdges, internalEdgesChange] =
    useEdgesState(initialEdges);

  // =========================================================
  // Sync when workflow or executingStepId changes
  // =========================================================

  useEffect(() => {
    const { nodes: nextNodes, edges: nextEdges } =
      buildWorkflowFlow(workflow);

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
      animated: Boolean(executingStepId && (e.source === executingStepId || e.target === executingStepId)),
    }));

    setNodes(updatedNodes);
    setEdges(updatedEdges);
  }, [workflow, executingStepId, setNodes, setEdges]);

  // =========================================================
  // Node drag
  // =========================================================

  const handleNodeDragStop = useCallback(
    (
      event: React.MouseEvent,
      node: Node<WorkflowStepNodeData>
    ) => {
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
  // Node changes
  // =========================================================

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      internalNodesChange(changes);
      onNodesChange?.(changes);
    },
    [internalNodesChange, onNodesChange]
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
        duration: 200,
      }}
      attributionPosition="bottom-left"
      className="bg-slate-50/60"
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#cbd5e1" />
      <Controls className="!bg-white !border-slate-200 !shadow-sm !rounded-xl overflow-hidden" />
      <MiniMap
        nodeColor="#3457ff"
        maskColor="rgba(248, 250, 252, 0.75)"
        style={{ width: 150, height: 100 }}
        className="!bg-white !border-slate-200 !rounded-xl !shadow-sm overflow-hidden"
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
