import React, { forwardRef, useState, useCallback } from "react";
import type { DAGNode, DAGEdge, Position, DragState } from "../../types/dag";
import Node from "../Node/Node";
import Edge from "../Edge/Edge";

interface CanvasProps {
  nodes: DAGNode[];
  edges: DAGEdge[];
  selectedItems: { nodes: string[]; edges: string[] };
  dragState: DragState;
  onNodePositionUpdate: (nodeId: string, position: Position) => void;
  onEdgeCreate: (sourceId: string, targetId: string) => boolean;
  onItemSelect: (
    type: "node" | "edge",
    id: string,
    multiSelect: boolean
  ) => void;
  onClearSelection: () => void;
  onDragStateChange: (dragState: DragState) => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 60;

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(
  (
    {
      nodes,
      edges,
      selectedItems,
      dragState,
      onNodePositionUpdate,
      onEdgeCreate,
      onItemSelect,
      onClearSelection,
      onDragStateChange,
    },
    ref
  ) => {
    const [connectionState, setConnectionState] = useState<{
      isConnecting: boolean;
      sourceNodeId: string | null;
      sourceSide: "left" | "right" | null;
      currentPosition: Position | null;
    }>({
      isConnecting: false,
      sourceNodeId: null,
      sourceSide: null,
      currentPosition: null,
    });

    const handleCanvasClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClearSelection();
        }
      },
      [onClearSelection]
    );

    const handleConnectionStart = useCallback(
      (nodeId: string, side: "left" | "right", position: Position) => {
        if (side === "left") return;

        setConnectionState({
          isConnecting: true,
          sourceNodeId: nodeId,
          sourceSide: side,
          currentPosition: position,
        });

        onDragStateChange({
          isDragging: true,
          dragType: "connection",
          dragData: { sourceNodeId: nodeId, sourceSide: side },
          startPosition: position,
          currentPosition: position,
        });
      },
      [onDragStateChange]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (connectionState.isConnecting) {
          const rect = (
            ref as React.RefObject<HTMLDivElement>
          )?.current?.getBoundingClientRect();
          if (!rect) return;

          const currentPosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };

          setConnectionState((prev) => {
            const newState = {
              ...prev,
              currentPosition,
            };

            onDragStateChange({
              isDragging: true,
              dragType: "connection",
              dragData: {
                sourceNodeId: prev.sourceNodeId!,
                sourceSide: prev.sourceSide!,
              },
              startPosition: prev.currentPosition!,
              currentPosition,
            });

            return newState;
          });
        }
      },
      [connectionState.isConnecting, ref, onDragStateChange]
    );

    const handleMouseUp = useCallback(
      (e: React.MouseEvent) => {
        if (!connectionState.isConnecting || !connectionState.sourceNodeId)
          return;

        const rect = (
          ref as React.RefObject<HTMLDivElement>
        )?.current?.getBoundingClientRect();
        if (!rect) return;

        const mousePos = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        let targetNodeId: string | null = null;

        for (const node of nodes) {
          const nodeLeft = node.position.x;
          const nodeTop = node.position.y;

          const leftConnectionX = nodeLeft;
          const leftConnectionY = nodeTop + NODE_HEIGHT / 2;

          const distance = Math.sqrt(
            Math.pow(mousePos.x - leftConnectionX, 2) +
              Math.pow(mousePos.y - leftConnectionY, 2)
          );

          if (distance <= 20 && node.id !== connectionState.sourceNodeId) {
            targetNodeId = node.id;
            break;
          }
        }

        if (targetNodeId) {
          onEdgeCreate(connectionState.sourceNodeId, targetNodeId);
        }

        setConnectionState({
          isConnecting: false,
          sourceNodeId: null,
          sourceSide: null,
          currentPosition: null,
        });

        onDragStateChange({
          isDragging: false,
          dragType: null,
          dragData: null,
          startPosition: null,
          currentPosition: null,
        });
      },
      [connectionState, onEdgeCreate, onDragStateChange, nodes, ref]
    );

    const renderConnectionLine = () => {
      if (!connectionState.isConnecting || !connectionState.currentPosition)
        return null;

      const sourceNode = nodes.find(
        (n) => n.id === connectionState.sourceNodeId
      );
      if (!sourceNode) return null;

      const sourcePosition = {
        x: sourceNode.position.x + NODE_WIDTH,
        y: sourceNode.position.y + NODE_HEIGHT / 2,
      };

      let nearTargetNode = false;
      let targetHighlight = null;

      for (const node of nodes) {
        if (node.id === connectionState.sourceNodeId) continue;

        const leftConnectionX = node.position.x;
        const leftConnectionY = node.position.y + NODE_HEIGHT / 2;

        const distance = Math.sqrt(
          Math.pow(connectionState.currentPosition.x - leftConnectionX, 2) +
            Math.pow(connectionState.currentPosition.y - leftConnectionY, 2)
        );

        if (distance <= 25) {
          nearTargetNode = true;
          targetHighlight = (
            <circle
              key={`highlight-${node.id}`}
              cx={leftConnectionX}
              cy={leftConnectionY}
              r="20"
              fill="rgba(34, 197, 94, 0.2)"
              stroke="#22c55e"
              strokeWidth="2"
              className="animate-pulse"
            />
          );
          break;
        }
      }

      return (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 25 }}
        >
          <defs>
            <marker
              id="temp-arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={nearTargetNode ? "#22c55e" : "#3b82f6"}
              />
            </marker>
          </defs>
          {targetHighlight}
          <path
            d={`M ${sourcePosition.x} ${sourcePosition.y} L ${connectionState.currentPosition.x} ${connectionState.currentPosition.y}`}
            stroke={nearTargetNode ? "#22c55e" : "#3b82f6"}
            strokeWidth={nearTargetNode ? 3 : 2}
            strokeDasharray="5,5"
            markerEnd="url(#temp-arrowhead)"
            fill="none"
            className={nearTargetNode ? "drop-shadow-lg" : ""}
          />
        </svg>
      );
    };

    return (
      <div
        ref={ref}
        className="canvas-container relative w-full h-full bg-gray-50 overflow-hidden cursor-default"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      >
        {edges.map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);

          if (!sourceNode || !targetNode) return null;

          return (
            <Edge
              key={edge.id}
              edge={edge}
              sourceNode={sourceNode}
              targetNode={targetNode}
              isSelected={selectedItems.edges.includes(edge.id)}
              onSelect={(edgeId, multiSelect) =>
                onItemSelect("edge", edgeId, multiSelect)
              }
            />
          );
        })}

        {nodes.map((node) => (
          <div key={node.id} data-node-id={node.id}>
            <Node
              node={node}
              isSelected={selectedItems.nodes.includes(node.id)}
              onPositionUpdate={onNodePositionUpdate}
              onSelect={(nodeId, multiSelect) =>
                onItemSelect("node", nodeId, multiSelect)
              }
              onConnectionStart={handleConnectionStart}
            />
          </div>
        ))}

        {renderConnectionLine()}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500 bg-white p-8 rounded-lg shadow-md border border-gray-200">
              <div className="text-lg font-medium mb-4">
                Welcome to Pipeline Editor
              </div>
              <div className="text-sm space-y-2">
                <p>🔵 Click "Add Node" to start building your DAG</p>
                <p>
                  🟢 Drag from green dots (right) to blue dots (left) to connect
                </p>
                <p>
                  👆 <strong>Drag nodes to move them around</strong>
                </p>
                <p>🗑️ Select and press Delete to remove items</p>
              </div>
            </div>
          </div>
        )}

        {connectionState.isConnecting && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg shadow-md z-30">
            🎯 Drag to a blue connection point to create edge
          </div>
        )}
      </div>
    );
  }
);

Canvas.displayName = "Canvas";

export default Canvas;
