import type { Position, DAGNode } from "../types/dag";

export const NODE_WIDTH = 120;
export const NODE_HEIGHT = 60;

export function calculateDistance(point1: Position, point2: Position): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateAngle(from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.atan2(dy, dx);
}

export function getNodeConnectionPoint(
  node: DAGNode,
  side: "left" | "right" | "top" | "bottom"
): Position {
  const centerX = node.position.x + NODE_WIDTH / 2;
  const centerY = node.position.y + NODE_HEIGHT / 2;

  switch (side) {
    case "left":
      return { x: node.position.x, y: centerY };
    case "right":
      return { x: node.position.x + NODE_WIDTH, y: centerY };
    case "top":
      return { x: centerX, y: node.position.y };
    case "bottom":
      return { x: centerX, y: node.position.y + NODE_HEIGHT };
    default:
      return { x: centerX, y: centerY };
  }
}

/**
 * Get the center point of a node
 */
export function getNodeCenter(node: DAGNode): Position {
  return {
    x: node.position.x + NODE_WIDTH / 2,
    y: node.position.y + NODE_HEIGHT / 2,
  };
}

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRect(
  point: Position,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if a point is near a node (within a threshold)
 */
export function isPointNearNode(
  point: Position,
  node: DAGNode,
  threshold: number = 10
): boolean {
  const nodeRect = {
    x: node.position.x - threshold,
    y: node.position.y - threshold,
    width: NODE_WIDTH + threshold * 2,
    height: NODE_HEIGHT + threshold * 2,
  };

  return isPointInRect(point, nodeRect);
}

/**
 * Find the closest node to a given point
 */
export function findClosestNode(
  point: Position,
  nodes: DAGNode[]
): DAGNode | null {
  if (nodes.length === 0) return null;

  let closestNode = nodes[0];
  let closestDistance = calculateDistance(point, getNodeCenter(closestNode));

  for (let i = 1; i < nodes.length; i++) {
    const distance = calculateDistance(point, getNodeCenter(nodes[i]));
    if (distance < closestDistance) {
      closestDistance = distance;
      closestNode = nodes[i];
    }
  }

  return closestNode;
}

/**
 * Calculate bounding box for a set of nodes
 */
export function calculateBoundingBox(nodes: DAGNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = nodes[0].position.x;
  let minY = nodes[0].position.y;
  let maxX = nodes[0].position.x + NODE_WIDTH;
  let maxY = nodes[0].position.y + NODE_HEIGHT;

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
    maxY = Math.max(maxY, node.position.y + NODE_HEIGHT);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Create a curved path between two points (for SVG paths)
 */
export function createCurvedPath(
  start: Position,
  end: Position,
  curvature: number = 0.3
): string {
  const dx = end.x - start.x;

  // Control points for bezier curve
  const cp1x = start.x + dx * curvature;
  const cp1y = start.y;
  const cp2x = end.x - dx * curvature;
  const cp2y = end.y;

  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
}

/**
 * Calculate points for an arrow head
 */
export function calculateArrowPoints(
  from: Position,
  to: Position,
  arrowLength: number = 8,
  arrowAngle: number = Math.PI / 6
): { point1: Position; point2: Position } {
  const angle = calculateAngle(from, to);

  const point1 = {
    x: to.x - arrowLength * Math.cos(angle - arrowAngle),
    y: to.y - arrowLength * Math.sin(angle - arrowAngle),
  };

  const point2 = {
    x: to.x - arrowLength * Math.cos(angle + arrowAngle),
    y: to.y - arrowLength * Math.sin(angle + arrowAngle),
  };

  return { point1, point2 };
}

/**
 * Check if two rectangles overlap
 */
export function doRectsOverlap(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

/**
 * Find a good position for a new node that doesn't overlap with existing nodes
 */
export function findNonOverlappingPosition(
  nodes: DAGNode[],
  preferredPosition?: Position,
  padding: number = 20
): Position {
  const startPosition = preferredPosition || { x: 100, y: 100 };
  const maxAttempts = 50;
  const step = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const testPosition = {
      x: startPosition.x + (attempt % 10) * step,
      y: startPosition.y + Math.floor(attempt / 10) * step,
    };

    const testRect = {
      x: testPosition.x - padding,
      y: testPosition.y - padding,
      width: NODE_WIDTH + padding * 2,
      height: NODE_HEIGHT + padding * 2,
    };

    const hasOverlap = nodes.some((node) => {
      const nodeRect = {
        x: node.position.x,
        y: node.position.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      };
      return doRectsOverlap(testRect, nodeRect);
    });

    if (!hasOverlap) {
      return testPosition;
    }
  }

  // If we can't find a non-overlapping position, return the preferred position
  return startPosition;
}
