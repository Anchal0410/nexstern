import React, { useRef, useState } from "react";
import { Circle } from "lucide-react";
import type { DAGNode, Position } from "../../types/dag";

interface NodeProps {
  node: DAGNode;
  isSelected: boolean;
  onPositionUpdate: (nodeId: string, position: Position) => void;
  onSelect: (nodeId: string, multiSelect: boolean) => void;
  onConnectionStart: (
    nodeId: string,
    side: "left" | "right",
    position: Position
  ) => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 60;

const Node: React.FC<NodeProps> = ({
  node,
  isSelected,
  onPositionUpdate,
  onSelect,
  onConnectionStart,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (target.classList.contains("connection-point")) {
      return;
    }

    onSelect(node.id, e.shiftKey || e.ctrlKey || e.metaKey);

    const nodeRect = nodeRef.current?.getBoundingClientRect();
    const canvasContainer = nodeRef.current?.closest(
      ".canvas-container"
    ) as HTMLElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();

    if (nodeRect && canvasRect) {
      setDragOffset({
        x: e.clientX - nodeRect.left,
        y: e.clientY - nodeRect.top,
      });
    }

    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasContainer) return;

      const canvasRect = canvasContainer.getBoundingClientRect();

      const newPosition = {
        x: e.clientX - canvasRect.left - dragOffset.x,
        y: e.clientY - canvasRect.top - dragOffset.y,
      };

      // Constrain to canvas bounds with some padding
      const padding = 10;
      newPosition.x = Math.max(
        padding,
        Math.min(newPosition.x, canvasRect.width - NODE_WIDTH - padding)
      );
      newPosition.y = Math.max(
        padding,
        Math.min(newPosition.y, canvasRect.height - NODE_HEIGHT - padding)
      );

      onPositionUpdate(node.id, newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleConnectionPointMouseDown = (
    e: React.MouseEvent,
    side: "left" | "right"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    // Only allow connections from right side (outgoing)
    if (side === "left") {
      return; // Left side is for receiving connections, not starting them
    }

    const nodeRect = nodeRef.current?.getBoundingClientRect();
    const canvasContainer = nodeRef.current?.closest(
      ".canvas-container"
    ) as HTMLElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();

    if (!nodeRect || !canvasRect) return;

    // Calculate connection position relative to canvas
    const connectionPosition = {
      x: nodeRect.right - canvasRect.left,
      y: nodeRect.top + nodeRect.height / 2 - canvasRect.top,
    };

    onConnectionStart(node.id, side, connectionPosition);
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute select-none transition-all duration-150 ${
        isSelected ? "z-20" : "z-10"
      } ${isDragging ? "cursor-grabbing scale-105" : "cursor-grab"}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Node Body */}
      <div
        className={`w-full h-full rounded-lg border-2 bg-white shadow-lg transition-all duration-200 flex items-center justify-center ${
          isSelected
            ? "border-blue-500 shadow-blue-200 shadow-lg"
            : "border-gray-300 hover:border-gray-400 hover:shadow-md"
        } ${isDragging ? "opacity-90" : ""}`}
      >
        <div className="text-center px-2 pointer-events-none">
          <Circle className="w-4 h-4 mx-auto mb-1 text-gray-500" />
          <div className="text-xs font-medium text-gray-700 truncate">
            {node.label}
          </div>
        </div>
      </div>

      {/* Left connection point (incoming) */}
      <div
        className="connection-point left-connection absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white cursor-crosshair hover:bg-blue-600 hover:scale-110 transition-all duration-200 shadow-md"
        style={{
          left: -8,
          top: "50%",
          transform: "translateY(-50%)",
        }}
        onMouseDown={(e) => handleConnectionPointMouseDown(e, "left")}
        title="Incoming connection point"
      />

      {/* Right connection point (outgoing) */}
      <div
        className="connection-point absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white cursor-crosshair hover:bg-green-600 hover:scale-110 transition-all duration-200 shadow-md"
        style={{
          right: -8,
          top: "50%",
          transform: "translateY(-50%)",
        }}
        onMouseDown={(e) => handleConnectionPointMouseDown(e, "right")}
        title="Outgoing connection point - drag from here"
      />

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-7 left-0 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {node.id}
        </div>
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default Node;
