// src/hooks/useNodeManagement.ts
import { useState, useCallback, useRef } from "react";
import type { DAGNode, Position } from "../types/dag";
import { useEffect } from "react";
interface UseNodeManagementReturn {
  nodes: DAGNode[];
  addNode: (label?: string, position?: Position) => DAGNode;
  removeNode: (nodeId: string) => void;
  removeNodes: (nodeIds: string[]) => void;
  updateNodePosition: (nodeId: string, position: Position) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  getNode: (nodeId: string) => DAGNode | undefined;
  clearNodes: () => void;
  setNodes: React.Dispatch<React.SetStateAction<DAGNode[]>>;
}

export const useNodeManagement = (
  initialNodes: DAGNode[] = []
): UseNodeManagementReturn => {
  const [nodes, setNodes] = useState<DAGNode[]>(initialNodes);
  const nodeIdCounter = useRef(1);

  // Find the highest existing node ID to continue numbering
  useEffect(() => {
    const maxId = nodes.reduce((max, node) => {
      const match = node.id.match(/node-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return Math.max(max, num);
      }
      return max;
    }, 0);
    nodeIdCounter.current = maxId + 1;
  }, []);

  const addNode = useCallback(
    (label?: string, position?: Position): DAGNode => {
      const nodeName = label || prompt("Enter node name:");
      if (!nodeName || !nodeName.trim()) {
        throw new Error("Node name is required");
      }

      const defaultPosition: Position = position || {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      };

      const newNode: DAGNode = {
        id: `node-${nodeIdCounter.current++}`,
        label: nodeName.trim(),
        position: defaultPosition,
        selected: false,
      };

      setNodes((prev) => [...prev, newNode]);
      return newNode;
    },
    []
  );

  const removeNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
  }, []);

  const removeNodes = useCallback((nodeIds: string[]) => {
    setNodes((prev) => prev.filter((node) => !nodeIds.includes(node.id)));
  }, []);

  const updateNodePosition = useCallback(
    (nodeId: string, position: Position) => {
      setNodes((prev) =>
        prev.map((node) => (node.id === nodeId ? { ...node, position } : node))
      );
    },
    []
  );

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    if (!label.trim()) return;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, label: label.trim() } : node
      )
    );
  }, []);

  const getNode = useCallback(
    (nodeId: string): DAGNode | undefined => {
      return nodes.find((node) => node.id === nodeId);
    },
    [nodes]
  );

  const clearNodes = useCallback(() => {
    setNodes([]);
    nodeIdCounter.current = 1;
  }, []);

  return {
    nodes,
    addNode,
    removeNode,
    removeNodes,
    updateNodePosition,
    updateNodeLabel,
    getNode,
    clearNodes,
    setNodes,
  };
};
