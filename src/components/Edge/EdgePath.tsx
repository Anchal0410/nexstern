import React from "react";
import type { Position } from "../../types/dag";

export interface EdgePathProps {
  sourcePosition: Position;
  targetPosition: Position;
  pathType?: "bezier" | "straight" | "step" | "smoothstep";
  curvature?: number;
  className?: string;
  style?: React.CSSProperties;
  markerEnd?: string;
  animated?: boolean;
}

const EdgePath: React.FC<EdgePathProps> = ({
  sourcePosition,
  targetPosition,
  pathType = "bezier",
  curvature = 0.25,
  className = "",
  style = {},
  markerEnd,
  animated = false,
}) => {
  const createBezierPath = (
    source: Position,
    target: Position,
    curve: number
  ): string => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;

    const controlPointDistance = Math.abs(dx) * curve;
    const cp1x = source.x + controlPointDistance;
    const cp1y = source.y;
    const cp2x = target.x - controlPointDistance;
    const cp2y = target.y;

    return `M ${source.x},${source.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${target.x},${target.y}`;
  };

  const createStraightPath = (source: Position, target: Position): string => {
    return `M ${source.x},${source.y} L ${target.x},${target.y}`;
  };

  const createStepPath = (source: Position, target: Position): string => {
    const midX = source.x + (target.x - source.x) / 2;
    return `M ${source.x},${source.y} L ${midX},${source.y} L ${midX},${target.y} L ${target.x},${target.y}`;
  };

  const createSmoothStepPath = (
    source: Position,
    target: Position,
    cornerRadius: number = 10
  ): string => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const midX = source.x + dx / 2;

    if (Math.abs(dy) < cornerRadius * 2) {
      // If vertical distance is small, use a simple bezier curve
      return createBezierPath(source, target, 0.1);
    }

    const radius = Math.min(cornerRadius, Math.abs(dx) / 4, Math.abs(dy) / 4);

    if (dy > 0) {
      // Target is below source
      return `M ${source.x},${source.y} 
              L ${midX - radius},${source.y} 
              Q ${midX},${source.y} ${midX},${source.y + radius}
              L ${midX},${target.y - radius}
              Q ${midX},${target.y} ${midX + radius},${target.y}
              L ${target.x},${target.y}`;
    } else {
      // Target is above source
      return `M ${source.x},${source.y} 
              L ${midX - radius},${source.y} 
              Q ${midX},${source.y} ${midX},${source.y - radius}
              L ${midX},${target.y + radius}
              Q ${midX},${target.y} ${midX + radius},${target.y}
              L ${target.x},${target.y}`;
    }
  };

  /**
   * Get the path string based on the selected path type
   */
  const getPathString = (): string => {
    switch (pathType) {
      case "straight":
        return createStraightPath(sourcePosition, targetPosition);
      case "step":
        return createStepPath(sourcePosition, targetPosition);
      case "smoothstep":
        return createSmoothStepPath(sourcePosition, targetPosition);
      case "bezier":
      default:
        return createBezierPath(sourcePosition, targetPosition, curvature);
    }
  };

  const pathString = getPathString();

  return (
    <path
      d={pathString}
      className={`edge-path ${animated ? "edge-animated" : ""} ${className}`}
      style={style}
      fill="none"
      markerEnd={markerEnd}
    />
  );
};

export default EdgePath;

/**
 * Utility function to calculate path length (useful for animations)
 */
export const getPathLength = (pathElement: SVGPathElement): number => {
  return pathElement.getTotalLength();
};

/**
 * Utility function to get a point along the path at a given percentage
 */
export const getPointAtLength = (
  pathElement: SVGPathElement,
  length: number
): DOMPoint => {
  return pathElement.getPointAtLength(length);
};

/**
 * Get the center point of a path (useful for labels)
 */
export const getPathCenter = (source: Position, target: Position): Position => {
  return {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2,
  };
};

/**
 * Calculate the angle of the path at a given point (useful for arrow rotation)
 */
export const getPathAngle = (source: Position, target: Position): number => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

/**
 * Create a gradient path that changes color along its length
 */
export const createGradientPath = (
  id: string,
  startColor: string,
  endColor: string
) => {
  return (
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={startColor} />
        <stop offset="100%" stopColor={endColor} />
      </linearGradient>
    </defs>
  );
};

/**
 * Pre-defined path configurations for common use cases
 */
export const EdgePathPresets = {
  default: {
    pathType: "bezier" as const,
    curvature: 0.25,
    animated: false,
  },
  straight: {
    pathType: "straight" as const,
    animated: false,
  },
  curved: {
    pathType: "bezier" as const,
    curvature: 0.4,
    animated: false,
  },
  step: {
    pathType: "step" as const,
    animated: false,
  },
  smoothStep: {
    pathType: "smoothstep" as const,
    animated: false,
  },
  animated: {
    pathType: "bezier" as const,
    curvature: 0.25,
    animated: true,
  },
};

/**
 * CSS classes for edge animations (to be added to your CSS file)
 */
export const edgeAnimationStyles = `
.edge-animated {
  stroke-dasharray: 5;
  animation: dash 1s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

.edge-path {
  transition: stroke-width 0.2s ease, stroke 0.2s ease;
}

.edge-path:hover {
  stroke-width: 3;
}

.edge-selected {
  stroke-width: 3;
  stroke: #3b82f6;
}

.edge-highlighted {
  stroke-width: 4;
  stroke: #22c55e;
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.4));
}
`;
