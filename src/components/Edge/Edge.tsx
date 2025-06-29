import React, { useState, useCallback } from "react";
import type { DAGEdge, DAGNode, Position } from "../../types/dag";
import EdgePath, { EdgePathPresets, getPathCenter } from "./EdgePath";

interface EdgeProps {
  edge: DAGEdge;
  sourceNode: DAGNode;
  targetNode: DAGNode;
  isSelected: boolean;
  isHighlighted?: boolean;
  pathType?: "bezier" | "straight" | "step" | "smoothstep";
  animated?: boolean;
  showLabel?: boolean;
  onSelect: (edgeId: string, multiSelect: boolean) => void;
  onHover?: (edgeId: string, isHovering: boolean) => void;
  onDoubleClick?: (edgeId: string) => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 60;

const Edge: React.FC<EdgeProps> = ({
  edge,
  sourceNode,
  targetNode,
  isSelected,
  isHighlighted = false,
  pathType = "bezier",
  animated = false,
  showLabel = false,
  onSelect,
  onHover,
  onDoubleClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const sourcePoint: Position = {
    x: sourceNode.position.x + NODE_WIDTH, // Right side of source node
    y: sourceNode.position.y + NODE_HEIGHT / 2, // Middle of source node
  };

  const targetPoint: Position = {
    x: targetNode.position.x, // Left side of target node
    y: targetNode.position.y + NODE_HEIGHT / 2, // Middle of target node
  };

  // Handle edge interactions
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(edge.id, e.shiftKey || e.ctrlKey || e.metaKey);
    },
    [edge.id, onSelect]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick?.(edge.id);
    },
    [edge.id, onDoubleClick]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover?.(edge.id, true);
  }, [edge.id, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover?.(edge.id, false);
  }, [edge.id, onHover]);

  // Calculate bounding box for the SVG
  const padding = 30;
  const minX = Math.min(sourcePoint.x, targetPoint.x) - padding;
  const maxX = Math.max(sourcePoint.x, targetPoint.x) + padding;
  const minY = Math.min(sourcePoint.y, targetPoint.y) - padding;
  const maxY = Math.max(sourcePoint.y, targetPoint.y) + padding;

  // Adjust coordinates relative to SVG viewport
  const adjustedSource: Position = {
    x: sourcePoint.x - minX,
    y: sourcePoint.y - minY,
  };

  const adjustedTarget: Position = {
    x: targetPoint.x - minX,
    y: targetPoint.y - minY,
  };

  // Determine edge appearance
  const getEdgeColor = (): string => {
    if (isHighlighted) return "#22c55e"; // Green for highlighted
    if (isSelected) return "#3b82f6"; // Blue for selected
    if (isHovered) return "#6b7280"; // Darker gray for hover
    return "#9ca3af"; // Default gray
  };

  const getEdgeWidth = (): number => {
    if (isHighlighted) return 4;
    if (isSelected || isHovered) return 3;
    return 2;
  };

  const edgeColor = getEdgeColor();
  const edgeWidth = getEdgeWidth();

  // Create unique marker ID for this edge
  const markerId = `arrowhead-${edge.id}`;

  // Calculate label position
  const labelPosition = getPathCenter(adjustedSource, adjustedTarget);

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
        zIndex: isSelected ? 15 : isHighlighted ? 12 : 5,
      }}
    >
      <defs>
        {/* Arrow marker */}
        <marker
          id={markerId}
          markerWidth="12"
          markerHeight="8"
          refX="11"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 12 4, 0 8" fill={edgeColor} stroke="none" />
        </marker>

        {/* Gradient for animated edges */}
        {animated && (
          <linearGradient
            id={`gradient-${edge.id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={edgeColor} stopOpacity="0.3" />
            <stop offset="50%" stopColor={edgeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={edgeColor} stopOpacity="0.3" />
          </linearGradient>
        )}
      </defs>

      {/* Invisible thick path for easier clicking */}
      <EdgePath
        sourcePosition={adjustedSource}
        targetPosition={adjustedTarget}
        // pathType={pathType}
        className="pointer-events-auto cursor-pointer"
        style={{
          stroke: "transparent",
          strokeWidth: 20,
          fill: "none",
        }}
        {...EdgePathPresets[
          pathType === "bezier"
            ? "default"
            : pathType === "smoothstep"
            ? "smoothStep"
            : pathType
        ]}
      />

      {/* Visible edge path */}
      <EdgePath
        sourcePosition={adjustedSource}
        targetPosition={adjustedTarget}
        // pathType={pathType}
        markerEnd={`url(#${markerId})`}
        // animated={animated}
        className={`pointer-events-none transition-all duration-200 ${
          isSelected ? "edge-selected" : ""
        } ${isHighlighted ? "edge-highlighted" : ""}`}
        style={{
          stroke: animated ? `url(#gradient-${edge.id})` : edgeColor,
          strokeWidth: edgeWidth,
          filter: isHighlighted
            ? "drop-shadow(0 0 6px rgba(34, 197, 94, 0.4))"
            : undefined,
        }}
        {...EdgePathPresets[
          pathType === "bezier"
            ? "default"
            : pathType === "smoothstep"
            ? "smoothStep"
            : pathType
        ]}
      />

      {/* Edge label */}
      {(showLabel || isSelected) && (
        <g>
          {/* Label background */}
          <rect
            x={labelPosition.x - 20}
            y={labelPosition.y - 12}
            width="40"
            height="16"
            rx="8"
            fill="white"
            stroke={edgeColor}
            strokeWidth="1"
            className="pointer-events-none"
          />
          {/* Label text */}
          <text
            x={labelPosition.x}
            y={labelPosition.y - 2}
            textAnchor="middle"
            className="text-xs font-medium pointer-events-none select-none"
            fill={edgeColor}
          >
            {edge.id.split("-")[1] || edge.id}
          </text>
        </g>
      )}

      {/* Hover area for interactions */}
      <EdgePath
        sourcePosition={adjustedSource}
        targetPosition={adjustedTarget}
        // pathType={pathType}
        className="pointer-events-auto cursor-pointer opacity-0"
        style={{
          strokeWidth: 20,
          stroke: "transparent",
          fill: "none",
        }}
        {...EdgePathPresets[
          pathType === "bezier"
            ? "default"
            : pathType === "smoothstep"
            ? "smoothStep"
            : pathType
        ]}
      />

      {/* Event handling overlay */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="transparent"
        className="pointer-events-auto cursor-pointer"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </svg>
  );
};

export default Edge;

// Export additional edge variants
export const StraightEdge: React.FC<EdgeProps> = (props) => (
  <Edge {...props} pathType="straight" />
);

export const StepEdge: React.FC<EdgeProps> = (props) => (
  <Edge {...props} pathType="step" />
);

export const SmoothStepEdge: React.FC<EdgeProps> = (props) => (
  <Edge {...props} pathType="smoothstep" />
);

export const AnimatedEdge: React.FC<EdgeProps> = (props) => (
  <Edge {...props} animated={true} />
);
