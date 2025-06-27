import { useState, useCallback, useRef } from "react";
import type { DAGEdge, DAGNode } from "../types/dag";
import { useEffect } from "react";
interface EdgeValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

interface UseEdgeManagementReturn {
  edges: DAGEdge[];
  addEdge: (sourceId: string, targetId: string) => boolean;
  removeEdge: (edgeId: string) => void;
  removeEdges: (edgeIds: string[]) => void;
  removeEdgesForNode: (nodeId: string) => void;
  removeEdgesForNodes: (nodeIds: string[]) => void;
  getEdge: (edgeId: string) => DAGEdge | undefined;
  getEdgesForNode: (nodeId: string) => {
    incoming: DAGEdge[];
    outgoing: DAGEdge[];
  };
  validateEdge: (sourceId: string, targetId: string) => EdgeValidationResult;
  clearEdges: () => void;
  setEdges: React.Dispatch<React.SetStateAction<DAGEdge[]>>;
}

export const useEdgeManagement = (
  initialEdges: DAGEdge[] = [],
  nodes: DAGNode[] = []
): UseEdgeManagementReturn => {
  const [edges, setEdges] = useState<DAGEdge[]>(initialEdges);
  const edgeIdCounter = useRef(1);

  // Find the highest existing edge ID to continue numbering
  useEffect(() => {
    const maxId = edges.reduce((max, edge) => {
      const match = edge.id.match(/edge-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return Math.max(max, num);
      }
      return max;
    }, 0);
    edgeIdCounter.current = maxId + 1;
  }, []);

  const validateEdge = useCallback(
    (sourceId: string, targetId: string): EdgeValidationResult => {
      // Rule 1: No self-connections
      if (sourceId === targetId) {
        return {
          isValid: false,
          errorMessage: "Self-connections are not allowed",
        };
      }

      // Rule 2: No duplicate edges
      const edgeExists = edges.some(
        (edge) => edge.source === sourceId && edge.target === targetId
      );

      if (edgeExists) {
        return {
          isValid: false,
          errorMessage: "Edge already exists between these nodes",
        };
      }

      // Rule 3: Both nodes must exist
      const sourceExists = nodes.some((node) => node.id === sourceId);
      const targetExists = nodes.some((node) => node.id === targetId);

      if (!sourceExists || !targetExists) {
        return {
          isValid: false,
          errorMessage: "Source or target node does not exist",
        };
      }

      // Rule 4: Check for potential cycles (simplified check)
      // This is a basic check - more comprehensive cycle detection is in validation hook
      const wouldCreateDirectCycle = edges.some(
        (edge) => edge.source === targetId && edge.target === sourceId
      );

      if (wouldCreateDirectCycle) {
        return {
          isValid: false,
          errorMessage: "This connection would create a direct cycle",
        };
      }

      return { isValid: true };
    },
    [edges, nodes]
  );

  const addEdge = useCallback(
    (sourceId: string, targetId: string): boolean => {
      const validation = validateEdge(sourceId, targetId);

      if (!validation.isValid) {
        if (validation.errorMessage) {
          alert(validation.errorMessage);
        }
        return false;
      }

      const newEdge: DAGEdge = {
        id: `edge-${edgeIdCounter.current++}`,
        source: sourceId,
        target: targetId,
        selected: false,
      };

      setEdges((prev) => [...prev, newEdge]);
      return true;
    },
    [validateEdge]
  );

  const removeEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
  }, []);

  const removeEdges = useCallback((edgeIds: string[]) => {
    setEdges((prev) => prev.filter((edge) => !edgeIds.includes(edge.id)));
  }, []);

  const removeEdgesForNode = useCallback((nodeId: string) => {
    setEdges((prev) =>
      prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  }, []);

  const removeEdgesForNodes = useCallback((nodeIds: string[]) => {
    setEdges((prev) =>
      prev.filter(
        (edge) =>
          !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
      )
    );
  }, []);

  const getEdge = useCallback(
    (edgeId: string): DAGEdge | undefined => {
      return edges.find((edge) => edge.id === edgeId);
    },
    [edges]
  );

  const getEdgesForNode = useCallback(
    (nodeId: string) => {
      const incoming = edges.filter((edge) => edge.target === nodeId);
      const outgoing = edges.filter((edge) => edge.source === nodeId);

      return { incoming, outgoing };
    },
    [edges]
  );

  const clearEdges = useCallback(() => {
    setEdges([]);
    edgeIdCounter.current = 1;
  }, []);

  return {
    edges,
    addEdge,
    removeEdge,
    removeEdges,
    removeEdgesForNode,
    removeEdgesForNodes,
    getEdge,
    getEdgesForNode,
    validateEdge,
    clearEdges,
    setEdges,
  };
};
