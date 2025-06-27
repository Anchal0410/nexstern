import { useMemo } from "react";
import type { DAGNode, DAGEdge, ValidationResult } from "../types/dag";

export const useDAGValidation = (
  nodes: DAGNode[],
  edges: DAGEdge[]
): ValidationResult => {
  return useMemo(() => {
    const errors: string[] = [];

    // Rule 1: At least 2 nodes
    if (nodes.length < 2) {
      errors.push("DAG must have at least 2 nodes");
    }

    // Rule 2: All nodes must be connected to at least one edge
    if (nodes.length >= 2) {
      const connectedNodes = new Set<string>();
      edges.forEach((edge) => {
        connectedNodes.add(edge.source);
        connectedNodes.add(edge.target);
      });

      const disconnectedNodes = nodes.filter(
        (node) => !connectedNodes.has(node.id)
      );
      if (disconnectedNodes.length > 0) {
        errors.push(
          `Disconnected nodes: ${disconnectedNodes
            .map((n) => n.label)
            .join(", ")}`
        );
      }
    }

    // Rule 3: No self-loops
    const selfLoops = edges.filter((edge) => edge.source === edge.target);
    if (selfLoops.length > 0) {
      errors.push("Self-loops are not allowed");
    }

    // Rule 4: No cycles (using DFS)
    if (nodes.length > 0 && edges.length > 0) {
      const hasCycle = detectCycle(nodes, edges);
      if (hasCycle) {
        errors.push("Graph contains cycles");
      }
    }

    return {
      isValid: errors.length === 0 && nodes.length >= 2,
      errors,
    };
  }, [nodes, edges]);
};

// Helper function to detect cycles using DFS
function detectCycle(nodes: DAGNode[], edges: DAGEdge[]): boolean {
  const graph = new Map<string, string[]>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Build adjacency list
  nodes.forEach((node) => {
    graph.set(node.id, []);
  });

  edges.forEach((edge) => {
    const neighbors = graph.get(edge.source) || [];
    neighbors.push(edge.target);
    graph.set(edge.source, neighbors);
  });

  // DFS function to detect cycle
  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // Back edge found, cycle detected
    }

    if (visited.has(nodeId)) {
      return false; // Already processed
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check for cycles starting from each unvisited node
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}
