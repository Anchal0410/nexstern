import * as dagre from "dagre";
import type { DAGNode, DAGEdge, LayoutOptions } from "../types/dag";
import { NODE_WIDTH, NODE_HEIGHT } from "./geometryUtils";

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  direction: "LR", // Left to Right
  nodeWidth: NODE_WIDTH,
  nodeHeight: NODE_HEIGHT,
  rankSep: 100, // Separation between ranks (levels)
  nodeSep: 50, // Separation between nodes in the same rank
};

export function applyDagreLayout(
  nodes: DAGNode[],
  edges: DAGEdge[],
  options: Partial<LayoutOptions> = {}
): DAGNode[] {
  if (nodes.length === 0) return nodes;

  const layoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...options };

  try {
    // Create a new dagre graph
    const graph = new dagre.graphlib.Graph();

    // Set graph properties
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: layoutOptions.direction,
      ranksep: layoutOptions.rankSep,
      nodesep: layoutOptions.nodeSep,
      marginx: 50,
      marginy: 50,
    });

    // Add nodes to the graph
    nodes.forEach((node) => {
      graph.setNode(node.id, {
        width: layoutOptions.nodeWidth,
        height: layoutOptions.nodeHeight,
        label: node.label,
      });
    });

    // Add edges to the graph
    edges.forEach((edge) => {
      graph.setEdge(edge.source, edge.target);
    });

    // Run the layout algorithm
    dagre.layout(graph);

    // Update node positions based on the layout
    const updatedNodes = nodes.map((node) => {
      const graphNode = graph.node(node.id);
      if (graphNode) {
        return {
          ...node,
          position: {
            // Dagre positions nodes by their center, so we need to offset by half width/height
            x: graphNode.x - layoutOptions.nodeWidth / 2,
            y: graphNode.y - layoutOptions.nodeHeight / 2,
          },
        };
      }
      return node;
    });

    return updatedNodes;
  } catch (error) {
    console.warn(
      "Dagre layout failed, falling back to hierarchical layout:",
      error
    );
    return calculateHierarchicalLayout(
      nodes,
      edges,
      layoutOptions.rankSep,
      layoutOptions.nodeSep
    );
  }
}

/**
 * Calculate layout for different arrangements
 */
export function calculateGridLayout(
  nodes: DAGNode[],
  columns: number = 3,
  spacing: { x: number; y: number } = { x: 150, y: 100 }
): DAGNode[] {
  return nodes.map((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    return {
      ...node,
      position: {
        x: col * spacing.x + 50,
        y: row * spacing.y + 50,
      },
    };
  });
}

/**
 * Calculate circular layout
 */
export function calculateCircularLayout(
  nodes: DAGNode[],
  radius: number = 200,
  center: { x: number; y: number } = { x: 300, y: 200 }
): DAGNode[] {
  if (nodes.length === 0) return nodes;
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: center }];
  }

  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, index) => {
    const angle = index * angleStep;
    return {
      ...node,
      position: {
        x: center.x + radius * Math.cos(angle) - NODE_WIDTH / 2,
        y: center.y + radius * Math.sin(angle) - NODE_HEIGHT / 2,
      },
    };
  });
}

/**
 * Calculate hierarchical layout (top-down)
 */
export function calculateHierarchicalLayout(
  nodes: DAGNode[],
  edges: DAGEdge[],
  levelSpacing: number = 120,
  nodeSpacing: number = 150
): DAGNode[] {
  if (nodes.length === 0) return nodes;

  // Find root nodes (nodes with no incoming edges)
  const incomingEdges = new Map<string, string[]>();
  const outgoingEdges = new Map<string, string[]>();

  nodes.forEach((node) => {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  });

  edges.forEach((edge) => {
    incomingEdges.get(edge.target)?.push(edge.source);
    outgoingEdges.get(edge.source)?.push(edge.target);
  });

  // Find levels using BFS
  const levels: string[][] = [];
  const visited = new Set<string>();
  const nodeToLevel = new Map<string, number>();

  // Start with root nodes (no incoming edges)
  const rootNodes = nodes.filter(
    (node) => (incomingEdges.get(node.id) || []).length === 0
  );

  if (rootNodes.length === 0) {
    // If no root nodes, use grid layout as fallback
    return calculateGridLayout(nodes, Math.ceil(Math.sqrt(nodes.length)));
  }

  let currentLevel = rootNodes.map((node) => node.id);
  let levelIndex = 0;

  while (currentLevel.length > 0) {
    levels[levelIndex] = [...currentLevel];
    currentLevel.forEach((nodeId) => {
      visited.add(nodeId);
      nodeToLevel.set(nodeId, levelIndex);
    });

    const nextLevel = new Set<string>();
    currentLevel.forEach((nodeId) => {
      const children = outgoingEdges.get(nodeId) || [];
      children.forEach((childId) => {
        if (!visited.has(childId)) {
          // Check if all parents of this child have been visited
          const parents = incomingEdges.get(childId) || [];
          const allParentsVisited = parents.every((parentId) =>
            visited.has(parentId)
          );
          if (allParentsVisited) {
            nextLevel.add(childId);
          }
        }
      });
    });

    currentLevel = Array.from(nextLevel);
    levelIndex++;
  }

  // Position nodes based on levels
  const updatedNodes = nodes.map((node) => {
    const level = nodeToLevel.get(node.id) ?? 0;
    const levelNodes = levels[level] || [];
    const positionInLevel = levelNodes.indexOf(node.id);
    const levelWidth = (levelNodes.length - 1) * nodeSpacing;
    const startX = -levelWidth / 2;

    return {
      ...node,
      position: {
        x: startX + positionInLevel * nodeSpacing + 300, // Center around x=300
        y: level * levelSpacing + 50,
      },
    };
  });

  return updatedNodes;
}

/**
 * Auto-fit layout to canvas view
 */
export function fitNodesToView(
  nodes: DAGNode[],
  canvasSize: { width: number; height: number },
  padding: number = 50
): { nodes: DAGNode[]; scale: number; offset: { x: number; y: number } } {
  if (nodes.length === 0) {
    return {
      nodes,
      scale: 1,
      offset: { x: 0, y: 0 },
    };
  }

  // Calculate bounding box
  let minX = nodes[0].position.x;
  let minY = nodes[0].position.y;
  let maxX = nodes[0].position.x + NODE_WIDTH;
  let maxY = nodes[0].position.y + NODE_HEIGHT;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
    maxY = Math.max(maxY, node.position.y + NODE_HEIGHT);
  });

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Calculate available space (canvas minus padding)
  const availableWidth = canvasSize.width - padding * 2;
  const availableHeight = canvasSize.height - padding * 2;

  // Calculate scale to fit content in available space
  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

  // Calculate offset to center the content
  const scaledContentWidth = contentWidth * scale;
  const scaledContentHeight = contentHeight * scale;

  const offsetX = (canvasSize.width - scaledContentWidth) / 2 - minX * scale;
  const offsetY = (canvasSize.height - scaledContentHeight) / 2 - minY * scale;

  // Apply transformation to nodes
  const transformedNodes = nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x * scale + offsetX,
      y: node.position.y * scale + offsetY,
    },
  }));

  return {
    nodes: transformedNodes,
    scale,
    offset: { x: offsetX, y: offsetY },
  };
}

/**
 * Detect and resolve node overlaps
 */
export function resolveNodeOverlaps(
  nodes: DAGNode[],
  minSpacing: number = 20
): DAGNode[] {
  if (nodes.length <= 1) return nodes;

  const resolvedNodes = [...nodes];
  const maxIterations = 10;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasOverlap = false;

    for (let i = 0; i < resolvedNodes.length; i++) {
      for (let j = i + 1; j < resolvedNodes.length; j++) {
        const node1 = resolvedNodes[i];
        const node2 = resolvedNodes[j];

        const dx = node2.position.x - node1.position.x;
        const dy = node2.position.y - node1.position.y;

        const minDistance = NODE_WIDTH + minSpacing;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          hasOverlap = true;

          // Calculate separation vector
          const separationDistance = (minDistance - distance) / 2;
          const angle = Math.atan2(dy, dx);

          const separationX = Math.cos(angle) * separationDistance;
          const separationY = Math.sin(angle) * separationDistance;

          // Move nodes apart
          resolvedNodes[i] = {
            ...node1,
            position: {
              x: node1.position.x - separationX,
              y: node1.position.y - separationY,
            },
          };

          resolvedNodes[j] = {
            ...node2,
            position: {
              x: node2.position.x + separationX,
              y: node2.position.y + separationY,
            },
          };
        }
      }
    }

    if (!hasOverlap) break;
  }

  return resolvedNodes;
}

/**
 * Get suggested layout based on graph structure
 */
export function getSuggestedLayout(
  nodes: DAGNode[],
  edges: DAGEdge[]
): "hierarchical" | "dagre" | "circular" | "grid" {
  if (nodes.length <= 1) return "grid";
  if (nodes.length <= 3) return "circular";

  // Count incoming edges for each node
  const incomingCounts = new Map<string, number>();
  nodes.forEach((node) => incomingCounts.set(node.id, 0));
  edges.forEach((edge) => {
    const count = incomingCounts.get(edge.target) || 0;
    incomingCounts.set(edge.target, count + 1);
  });

  // Check if it's a tree-like structure (most nodes have 0 or 1 incoming edge)
  const treelike =
    Array.from(incomingCounts.values()).filter((count) => count <= 1).length /
    nodes.length;

  if (treelike > 0.8) {
    return "hierarchical";
  } else if (edges.length > 0) {
    return "dagre";
  } else {
    return nodes.length <= 10 ? "circular" : "grid";
  }
}

/**
 * Apply the best layout algorithm based on graph structure
 */
export function applyBestLayout(
  nodes: DAGNode[],
  edges: DAGEdge[],
  canvasSize?: { width: number; height: number }
): DAGNode[] {
  const layoutType = getSuggestedLayout(nodes, edges);

  let layoutedNodes: DAGNode[];

  switch (layoutType) {
    case "hierarchical":
      layoutedNodes = calculateHierarchicalLayout(nodes, edges);
      break;
    case "dagre":
      layoutedNodes = applyDagreLayout(nodes, edges);
      break;
    case "circular":
      layoutedNodes = calculateCircularLayout(nodes);
      break;
    case "grid":
    default:
      layoutedNodes = calculateGridLayout(nodes);
      break;
  }

  // Resolve any overlaps
  layoutedNodes = resolveNodeOverlaps(layoutedNodes);

  // If canvas size is provided, fit to view
  if (canvasSize) {
    const fitted = fitNodesToView(layoutedNodes, canvasSize);
    return fitted.nodes;
  }

  return layoutedNodes;
}
