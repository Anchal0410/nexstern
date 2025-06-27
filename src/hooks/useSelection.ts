import { useState, useCallback } from "react";

interface SelectionState {
  nodes: string[];
  edges: string[];
}

interface UseSelectionReturn {
  selectedItems: SelectionState;
  selectNode: (nodeId: string, multiSelect?: boolean) => void;
  selectEdge: (edgeId: string, multiSelect?: boolean) => void;
  selectNodes: (nodeIds: string[], replace?: boolean) => void;
  selectEdges: (edgeIds: string[], replace?: boolean) => void;
  toggleNodeSelection: (nodeId: string) => void;
  toggleEdgeSelection: (edgeId: string) => void;
  clearSelection: () => void;
  clearNodeSelection: () => void;
  clearEdgeSelection: () => void;
  isNodeSelected: (nodeId: string) => boolean;
  isEdgeSelected: (edgeId: string) => boolean;
  hasSelection: () => boolean;
  getSelectionCount: () => { nodes: number; edges: number; total: number };
  selectAll: (nodeIds: string[], edgeIds: string[]) => void;
  invertSelection: (nodeIds: string[], edgeIds: string[]) => void;
}

export const useSelection = (
  initialSelection: SelectionState = { nodes: [], edges: [] }
): UseSelectionReturn => {
  const [selectedItems, setSelectedItems] =
    useState<SelectionState>(initialSelection);

  const selectNode = useCallback(
    (nodeId: string, multiSelect: boolean = false) => {
      setSelectedItems((prev) => {
        if (multiSelect) {
          const isSelected = prev.nodes.includes(nodeId);
          return {
            ...prev,
            nodes: isSelected
              ? prev.nodes.filter((id) => id !== nodeId)
              : [...prev.nodes, nodeId],
          };
        } else {
          return {
            ...prev,
            nodes: [nodeId],
            edges: [],
          };
        }
      });
    },
    []
  );

  const selectEdge = useCallback(
    (edgeId: string, multiSelect: boolean = false) => {
      setSelectedItems((prev) => {
        if (multiSelect) {
          const isSelected = prev.edges.includes(edgeId);
          return {
            ...prev,
            edges: isSelected
              ? prev.edges.filter((id) => id !== edgeId)
              : [...prev.edges, edgeId],
          };
        } else {
          return {
            ...prev,
            edges: [edgeId],
            nodes: [],
          };
        }
      });
    },
    []
  );

  const selectNodes = useCallback(
    (nodeIds: string[], replace: boolean = true) => {
      setSelectedItems((prev) => ({
        ...prev,
        nodes: replace ? nodeIds : [...new Set([...prev.nodes, ...nodeIds])],
      }));
    },
    []
  );

  const selectEdges = useCallback(
    (edgeIds: string[], replace: boolean = true) => {
      setSelectedItems((prev) => ({
        ...prev,
        edges: replace ? edgeIds : [...new Set([...prev.edges, ...edgeIds])],
      }));
    },
    []
  );

  const toggleNodeSelection = useCallback((nodeId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      nodes: prev.nodes.includes(nodeId)
        ? prev.nodes.filter((id) => id !== nodeId)
        : [...prev.nodes, nodeId],
    }));
  }, []);

  const toggleEdgeSelection = useCallback((edgeId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      edges: prev.edges.includes(edgeId)
        ? prev.edges.filter((id) => id !== edgeId)
        : [...prev.edges, edgeId],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems({ nodes: [], edges: [] });
  }, []);

  const clearNodeSelection = useCallback(() => {
    setSelectedItems((prev) => ({ ...prev, nodes: [] }));
  }, []);

  const clearEdgeSelection = useCallback(() => {
    setSelectedItems((prev) => ({ ...prev, edges: [] }));
  }, []);

  const isNodeSelected = useCallback(
    (nodeId: string): boolean => {
      return selectedItems.nodes.includes(nodeId);
    },
    [selectedItems.nodes]
  );

  const isEdgeSelected = useCallback(
    (edgeId: string): boolean => {
      return selectedItems.edges.includes(edgeId);
    },
    [selectedItems.edges]
  );

  const hasSelection = useCallback((): boolean => {
    return selectedItems.nodes.length > 0 || selectedItems.edges.length > 0;
  }, [selectedItems]);

  const getSelectionCount = useCallback(() => {
    return {
      nodes: selectedItems.nodes.length,
      edges: selectedItems.edges.length,
      total: selectedItems.nodes.length + selectedItems.edges.length,
    };
  }, [selectedItems]);

  const selectAll = useCallback((nodeIds: string[], edgeIds: string[]) => {
    setSelectedItems({
      nodes: [...nodeIds],
      edges: [...edgeIds],
    });
  }, []);

  const invertSelection = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      setSelectedItems((prev) => ({
        nodes: nodeIds.filter((id) => !prev.nodes.includes(id)),
        edges: edgeIds.filter((id) => !prev.edges.includes(id)),
      }));
    },
    []
  );

  return {
    selectedItems,
    selectNode,
    selectEdge,
    selectNodes,
    selectEdges,
    toggleNodeSelection,
    toggleEdgeSelection,
    clearSelection,
    clearNodeSelection,
    clearEdgeSelection,
    isNodeSelected,
    isEdgeSelected,
    hasSelection,
    getSelectionCount,
    selectAll,
    invertSelection,
  };
};
