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
} from "reactflow";

import "reactflow/dist/style.css";

import WorkflowStepNode from "@/components/workflow/WorkflowStepNode";
import {
  buildWorkflowFlow,
  WorkflowStepNodeData,
} from "@/lib/workflow-flow";
import { Workflow } from "@/types/workflow";

// =========================================================
// Node Types
// =========================================================

const nodeTypes: NodeTypes = {
  workflowStep: WorkflowStepNode,
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
}

// =========================================================
// WorkflowCanvas
// =========================================================

function WorkflowCanvasInner({
  workflow,
  onNodeClick,
  onNodeDragStop,
  onConnect,
  onNodesChange,
  onEdgesChange,
}: WorkflowCanvasProps) {
  const { nodes: initialNodes, edges: initialEdges } =
    buildWorkflowFlow(workflow);

  const [nodes, setNodes, internalNodesChange] =
    useNodesState<WorkflowStepNodeData>(initialNodes);

  const [edges, setEdges, internalEdgesChange] =
    useEdgesState(initialEdges);

  // =========================================================
  // Sync only when workflow data actually changes
  // =========================================================

  useEffect(() => {
    const { nodes: nextNodes, edges: nextEdges } =
      buildWorkflowFlow(workflow);

    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [workflow, setNodes, setEdges]);

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
        addEdge(connection, currentEdges)
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
        padding: 0.2,
        duration: 0,
      }}
      attributionPosition="bottom-left"
    >
      <Background />
      <Controls />
      <MiniMap />
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