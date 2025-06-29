// src/utils/layoutUtils.ts - Improved with cleaner layouts
import * as dagre from "dagre";
import type { DAGNode, DAGEdge, LayoutOptions } from "../types/dag";
import { NODE_WIDTH, NODE_HEIGHT } from "./geometryUtils";

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  direction: "LR", // Left to Right
  nodeWidth: NODE_WIDTH,
  nodeHeight: NODE_HEIGHT,
  rankSep: 180, // Increased for better spacing
  nodeSep: 100, // Increased for cleaner look
};

/**
 * Enhanced Dagre layout with better spacing and alignment
 */
export function applyDagreLayout(
  nodes: DAGNode[],
  edges: DAGEdge[],
  options: Partial<LayoutOptions> = {}
): DAGNode[] {
  if (nodes.length === 0) return nodes;

  const layoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...options };

  try {
    const graph = new dagre.graphlib.Graph();

    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: layoutOptions.direction,
      ranksep: layoutOptions.rankSep,
      nodesep: layoutOptions.nodeSep,
      marginx: 80,
      marginy: 80,
      align: "UL", // Align nodes to upper-left for consistency
      acyclicer: "greedy", // Better cycle removal
      ranker: "tight-tree", // Better ranking algorithm
    });

    // Add nodes with proper dimensions
    nodes.forEach((node) => {
      graph.setNode(node.id, {
        width: layoutOptions.nodeWidth,
        height: layoutOptions.nodeHeight,
        label: node.label,
      });
    });

    // Add edges
    edges.forEach((edge) => {
      graph.setEdge(edge.source, edge.target, {
        weight: 1,
        minlen: 1,
      });
    });

    dagre.layout(graph);

    const updatedNodes = nodes.map((node) => {
      const graphNode = graph.node(node.id);
      if (graphNode) {
        return {
          ...node,
          position: {
            x: Math.round(graphNode.x - layoutOptions.nodeWidth / 2),
            y: Math.round(graphNode.y - layoutOptions.nodeHeight / 2),
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
 * Improved grid layout with better spacing and alignment
 */
export function calculateGridLayout(
  nodes: DAGNode[],
  columns?: number,
  spacing: { x: number; y: number } = { x: 200, y: 140 }
): DAGNode[] {
  if (nodes.length === 0) return nodes;

  // Calculate optimal number of columns based on node count
  const optimalColumns = columns || Math.ceil(Math.sqrt(nodes.length * 1.2));
  const actualColumns = Math.min(optimalColumns, nodes.length);

  // Calculate starting position to center the grid
  const totalRows = Math.ceil(nodes.length / actualColumns);
  const gridWidth = (actualColumns - 1) * spacing.x;
  const gridHeight = (totalRows - 1) * spacing.y;

  const startX = 100;
  const startY = 100;

  return nodes.map((node, index) => {
    const col = index % actualColumns;
    const row = Math.floor(index / actualColumns);

    return {
      ...node,
      position: {
        x: startX + col * spacing.x,
        y: startY + row * spacing.y,
      },
    };
  });
}

/**
 * Enhanced circular layout with better distribution
 */
export function calculateCircularLayout(
  nodes: DAGNode[],
  radius?: number,
  center: { x: number; y: number } = { x: 400, y: 300 }
): DAGNode[] {
  if (nodes.length === 0) return nodes;

  if (nodes.length === 1) {
    return [
      {
        ...nodes[0],
        position: {
          x: center.x - NODE_WIDTH / 2,
          y: center.y - NODE_HEIGHT / 2,
        },
      },
    ];
  }

  // Calculate optimal radius based on number of nodes
  const optimalRadius = radius || Math.max(150, nodes.length * 25);
  const angleStep = (2 * Math.PI) / nodes.length;

  // Start from top (negative Y direction)
  const startAngle = -Math.PI / 2;

  return nodes.map((node, index) => {
    const angle = startAngle + index * angleStep;
    return {
      ...node,
      position: {
        x: Math.round(
          center.x + optimalRadius * Math.cos(angle) - NODE_WIDTH / 2
        ),
        y: Math.round(
          center.y + optimalRadius * Math.sin(angle) - NODE_HEIGHT / 2
        ),
      },
    };
  });
}

/**
 * Enhanced hierarchical layout with better level distribution
 */
export function calculateHierarchicalLayout(
  nodes: DAGNode[],
  edges: DAGEdge[],
  levelSpacing: number = 180,
  nodeSpacing: number = 160
): DAGNode[] {
  if (nodes.length === 0) return nodes;

  const incomingEdges = new Map<string, string[]>();
  const outgoingEdges = new Map<string, string[]>();

  // Initialize maps
  nodes.forEach((node) => {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  });

  edges.forEach((edge) => {
    incomingEdges.get(edge.target)?.push(edge.source);
    outgoingEdges.get(edge.source)?.push(edge.target);
  });

  // Find levels using improved BFS
  const levels: string[][] = [];
  const visited = new Set<string>();
  const nodeToLevel = new Map<string, number>();

  // Find root nodes
  const rootNodes = nodes.filter(
    (node) => (incomingEdges.get(node.id) || []).length === 0
  );

  if (rootNodes.length === 0) {
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

  // Handle disconnected nodes
  const unvisitedNodes = nodes.filter((node) => !visited.has(node.id));
  if (unvisitedNodes.length > 0) {
    levels[levelIndex] = unvisitedNodes.map((node) => node.id);
    unvisitedNodes.forEach((node) => {
      nodeToLevel.set(node.id, levelIndex);
    });
  }

  // Calculate positions with improved spacing
  const updatedNodes = nodes.map((node) => {
    const level = nodeToLevel.get(node.id) ?? 0;
    const levelNodes = levels[level] || [];
    const positionInLevel = levelNodes.indexOf(node.id);

    // Center nodes in each level
    const levelWidth = Math.max((levelNodes.length - 1) * nodeSpacing, 0);
    const startX = 200 - levelWidth / 2; // Center around x=200

    return {
      ...node,
      position: {
        x: Math.round(startX + positionInLevel * nodeSpacing),
        y: Math.round(level * levelSpacing + 80),
      },
    };
  });

  return updatedNodes;
}

/**
 * New: Tree layout for hierarchical data
 */
export function calculateTreeLayout(
  nodes: DAGNode[],
  edges: DAGEdge[],
  direction: "vertical" | "horizontal" = "vertical"
): DAGNode[] {
  if (nodes.length === 0) return nodes;

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

  // Find root node
  const rootNodes = nodes.filter(
    (node) => (incomingEdges.get(node.id) || []).length === 0
  );

  if (rootNodes.length === 0) {
    return calculateHierarchicalLayout(nodes, edges);
  }

  const rootNode = rootNodes[0];
  const positions = new Map<string, { x: number; y: number }>();

  // Calculate tree positions recursively
  function calculateSubtreePositions(
    nodeId: string,
    level: number,
    siblingIndex: number,
    siblingsCount: number
  ): number {
    const children = outgoingEdges.get(nodeId) || [];
    const childSpacing = direction === "vertical" ? 160 : 200;
    const levelSpacing = direction === "vertical" ? 140 : 180;

    if (children.length === 0) {
      // Leaf node
      const x =
        direction === "vertical"
          ? siblingIndex * childSpacing + 100
          : level * levelSpacing + 100;
      const y =
        direction === "vertical"
          ? level * levelSpacing + 80
          : siblingIndex * childSpacing + 100;

      positions.set(nodeId, { x: Math.round(x), y: Math.round(y) });
      return 1;
    }

    // Calculate positions for children first
    let totalWidth = 0;
    children.forEach((childId, index) => {
      totalWidth += calculateSubtreePositions(
        childId,
        level + 1,
        totalWidth,
        children.length
      );
    });

    // Position current node at center of children
    const firstChild = positions.get(children[0]);
    const lastChild = positions.get(children[children.length - 1]);

    if (firstChild && lastChild) {
      const centerX = (firstChild.x + lastChild.x) / 2;
      const centerY =
        direction === "vertical"
          ? level * levelSpacing + 80
          : (firstChild.y + lastChild.y) / 2;

      const x = direction === "vertical" ? centerX : level * levelSpacing + 100;
      const y = direction === "vertical" ? centerY : centerX;

      positions.set(nodeId, { x: Math.round(x), y: Math.round(y) });
    }

    return totalWidth;
  }

  calculateSubtreePositions(rootNode.id, 0, 0, 1);

  return nodes.map((node) => {
    const pos = positions.get(node.id);
    return {
      ...node,
      position: pos || node.position,
    };
  });
}

/**
 * New: Force-directed layout for better node distribution
 */
export function calculateForceLayout(
  nodes: DAGNode[],
  edges: DAGEdge[],
  iterations: number = 100,
  canvasSize: { width: number; height: number } = { width: 800, height: 600 }
): DAGNode[] {
  if (nodes.length === 0) return nodes;

  // Initialize positions
  const positions = nodes.map((node, index) => ({
    id: node.id,
    x: node.position.x || canvasSize.width / 2 + (Math.random() - 0.5) * 200,
    y: node.position.y || canvasSize.height / 2 + (Math.random() - 0.5) * 200,
    vx: 0,
    vy: 0,
  }));

  const repulsionStrength = 8000;
  const attractionStrength = 0.05;
  const damping = 0.85;
  const centeringForce = 0.001;

  for (let iter = 0; iter < iterations; iter++) {
    // Reset velocities
    positions.forEach((p) => {
      p.vx = 0;
      p.vy = 0;
    });

    // Repulsion between all nodes
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsionStrength / (distance * distance);

        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        positions[i].vx -= fx;
        positions[i].vy -= fy;
        positions[j].vx += fx;
        positions[j].vy += fy;
      }
    }

    // Attraction along edges
    edges.forEach((edge) => {
      const source = positions.find((p) => p.id === edge.source);
      const target = positions.find((p) => p.id === edge.target);

      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const fx = dx * attractionStrength;
        const fy = dy * attractionStrength;

        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    });

    // Centering force
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    positions.forEach((p) => {
      p.vx += (centerX - p.x) * centeringForce;
      p.vy += (centerY - p.y) * centeringForce;
    });

    // Apply velocities and update positions
    positions.forEach((p) => {
      p.vx *= damping;
      p.vy *= damping;
      p.x += p.vx;
      p.y += p.vy;

      // Keep within bounds with padding
      const padding = 100;
      p.x = Math.max(padding, Math.min(p.x, canvasSize.width - padding));
      p.y = Math.max(padding, Math.min(p.y, canvasSize.height - padding));
    });
  }

  return nodes.map((node) => {
    const pos = positions.find((p) => p.id === node.id);
    return {
      ...node,
      position: {
        x: Math.round(pos?.x || node.position.x),
        y: Math.round(pos?.y || node.position.y),
      },
    };
  });
}

/**
 * Enhanced node overlap resolution with better spacing
 */
export function resolveNodeOverlaps(
  nodes: DAGNode[],
  minSpacing: number = 40
): DAGNode[] {
  if (nodes.length <= 1) return nodes;

  const resolvedNodes = [...nodes];
  const maxIterations = 15;
  const minDistance = NODE_WIDTH + minSpacing;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasOverlap = false;

    for (let i = 0; i < resolvedNodes.length; i++) {
      for (let j = i + 1; j < resolvedNodes.length; j++) {
        const node1 = resolvedNodes[i];
        const node2 = resolvedNodes[j];

        const dx = node2.position.x - node1.position.x;
        const dy = node2.position.y - node1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          hasOverlap = true;

          const separationDistance = (minDistance - distance) / 2 + 5;
          const angle = Math.atan2(dy, dx);

          const separationX = Math.cos(angle) * separationDistance;
          const separationY = Math.sin(angle) * separationDistance;

          resolvedNodes[i] = {
            ...node1,
            position: {
              x: Math.round(node1.position.x - separationX),
              y: Math.round(node1.position.y - separationY),
            },
          };

          resolvedNodes[j] = {
            ...node2,
            position: {
              x: Math.round(node2.position.x + separationX),
              y: Math.round(node2.position.y + separationY),
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
 * Enhanced layout suggestion with better heuristics
 */
export function getSuggestedLayout(
  nodes: DAGNode[],
  edges: DAGEdge[]
): "hierarchical" | "dagre" | "circular" | "grid" | "tree" | "force" {
  if (nodes.length <= 1) return "grid";
  if (nodes.length <= 4) return "circular";

  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();

  nodes.forEach((node) => {
    incomingCounts.set(node.id, 0);
    outgoingCounts.set(node.id, 0);
  });

  edges.forEach((edge) => {
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) || 0) + 1);
    outgoingCounts.set(edge.source, (outgoingCounts.get(edge.source) || 0) + 1);
  });

  // Check if it's a tree structure
  const rootNodes = Array.from(incomingCounts.entries()).filter(
    ([_, count]) => count === 0
  );
  const leafNodes = Array.from(outgoingCounts.entries()).filter(
    ([_, count]) => count === 0
  );

  if (rootNodes.length === 1 && edges.length === nodes.length - 1) {
    return "tree"; // Perfect tree
  }

  // Check if it's hierarchical
  const treelike =
    Array.from(incomingCounts.values()).filter((count) => count <= 1).length /
    nodes.length;

  if (treelike > 0.8 && edges.length > 0) {
    return "hierarchical";
  }

  // Check if it's densely connected (good for force layout)
  const density = edges.length / ((nodes.length * (nodes.length - 1)) / 2);
  if (density > 0.3) {
    return "force";
  }

  // Use dagre for moderate complexity
  if (edges.length > 0 && nodes.length <= 20) {
    return "dagre";
  }

  // Default cases
  return nodes.length <= 12 ? "circular" : "grid";
}

/**
 * Enhanced best layout application with better results
 */
export function applyBestLayout(
  nodes: DAGNode[],
  edges: DAGEdge[],
  canvasSize?: { width: number; height: number }
): DAGNode[] {
  const layoutType = getSuggestedLayout(nodes, edges);
  let layoutedNodes: DAGNode[];

  const defaultCanvasSize = canvasSize || { width: 800, height: 600 };

  switch (layoutType) {
    case "tree":
      layoutedNodes = calculateTreeLayout(nodes, edges, "vertical");
      break;
    case "hierarchical":
      layoutedNodes = calculateHierarchicalLayout(nodes, edges, 180, 160);
      break;
    case "dagre":
      layoutedNodes = applyDagreLayout(nodes, edges, {
        rankSep: 200,
        nodeSep: 120,
        direction: "LR",
      });
      break;
    case "force":
      layoutedNodes = calculateForceLayout(
        nodes,
        edges,
        150,
        defaultCanvasSize
      );
      break;
    case "circular":
      layoutedNodes = calculateCircularLayout(nodes);
      break;
    case "grid":
    default:
      const cols = Math.ceil(Math.sqrt(nodes.length * 1.5));
      layoutedNodes = calculateGridLayout(nodes, cols, { x: 200, y: 150 });
      break;
  }

  // Always resolve overlaps for cleaner appearance
  layoutedNodes = resolveNodeOverlaps(layoutedNodes, 50);

  return layoutedNodes;
}

/**
 * Fit nodes to view with improved centering
 */
export function fitNodesToView(
  nodes: DAGNode[],
  canvasSize: { width: number; height: number },
  padding: number = 80
): { nodes: DAGNode[]; scale: number; offset: { x: number; y: number } } {
  if (nodes.length === 0) {
    return { nodes, scale: 1, offset: { x: 0, y: 0 } };
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
  const availableWidth = canvasSize.width - padding * 2;
  const availableHeight = canvasSize.height - padding * 2;

  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1.2); // Allow slight zoom in

  const scaledContentWidth = contentWidth * scale;
  const scaledContentHeight = contentHeight * scale;

  const offsetX = (canvasSize.width - scaledContentWidth) / 2 - minX * scale;
  const offsetY = (canvasSize.height - scaledContentHeight) / 2 - minY * scale;

  const transformedNodes = nodes.map((node) => ({
    ...node,
    position: {
      x: Math.round(node.position.x * scale + offsetX),
      y: Math.round(node.position.y * scale + offsetY),
    },
  }));

  return {
    nodes: transformedNodes,
    scale,
    offset: { x: offsetX, y: offsetY },
  };
}
