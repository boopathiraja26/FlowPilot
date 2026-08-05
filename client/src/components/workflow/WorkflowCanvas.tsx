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

export function WorkflowCanvas({
  workflow,
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
  // Sync workflow changes
  // =========================================================

  useEffect(() => {
    const { nodes, edges } = buildWorkflowFlow(workflow);

    setNodes(nodes);
    setEdges(edges);
  }, [workflow, setNodes, setEdges]);

  // =========================================================
  // Drag Stop
  // =========================================================

  const handleNodeDragStop = useCallback(
    (
      event: React.MouseEvent,
      node: Node
    ) => {
      onNodeDragStop?.(event, node as Node<WorkflowStepNodeData>, nodes);
    },
    [onNodeDragStop, nodes]
  );

  // =========================================================
  // Connect Nodes
  // =========================================================

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => addEdge(connection, current));

      onConnect?.(connection);
    },
    [setEdges, onConnect]
  );

  // =========================================================
  // Node Changes
  // =========================================================

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      internalNodesChange(changes);

      onNodesChange?.(changes);
    },
    [internalNodesChange, onNodesChange]
  );

  // =========================================================
  // Edge Changes
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
    <div className="h-full w-full rounded-xl overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
  nodes={nodes}
  edges={edges}
  onNodeClick={(_, node) => {
    onNodesChange?.([
      {
        id: node.id,
        type: "select",
        selected: true,
      },
    ]);
  }}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeDragStop={handleNodeDragStop}
          nodesDraggable
          nodesConnectable
          elementsSelectable
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}