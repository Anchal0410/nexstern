import React, { useCallback, useRef, useEffect } from "react";
import { Plus, Layout, Trash2, Download, RotateCcw } from "lucide-react";
import type { DragState } from "../../types/dag";
import Canvas from "../Canvas/Canvas";
import CanvasControls from "../Canvas/CanvasControls";
import StatusPanel from "../UI/StatusPanel";
import JSONPreview from "../UI/JSONPreview";
import Button from "../UI/Button";
import { useDAGValidation } from "../../hooks/useDAGValidation";
import { useNodeManagement } from "../../hooks/useNodeManagement";
import { useEdgeManagement } from "../../hooks/useEdgeManagement";
import { useSelection } from "../../hooks/useSelection";
import { useCanvasState } from "../../hooks/useCanvasState";
import { applyBestLayout } from "../../utils/layoutUtils";
import { findNonOverlappingPosition } from "../../utils/geometryUtils";

const PipelineEditor: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const nodeManagement = useNodeManagement([]);
  const edgeManagement = useEdgeManagement([], nodeManagement.nodes);
  const selection = useSelection();
  const canvasState = useCanvasState();
  const validation = useDAGValidation(
    nodeManagement.nodes,
    edgeManagement.edges
  );

  const [dragState, setDragState] = React.useState<DragState>({
    isDragging: false,
    dragType: null,
    dragData: null,
    startPosition: null,
    currentPosition: null,
  });

  const [showJSONPreview, setShowJSONPreview] = React.useState(false);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        canvasState.updateCanvasSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [canvasState]);

  // Node management functions
  const addNode = useCallback(() => {
    try {
      // Find a good position that doesn't overlap with existing nodes
      const position = findNonOverlappingPosition(nodeManagement.nodes, {
        x: Math.random() * 300 + 100,
        y: Math.random() * 200 + 100,
      });

      const newNode = nodeManagement.addNode(undefined, position);
      selection.clearSelection();
      selection.selectNode(newNode.id);
    } catch (error) {
      // User cancelled the prompt
      console.log("Node creation cancelled");
    }
  }, [nodeManagement, selection]);

  const deleteSelectedItems = useCallback(() => {
    const { nodes: selectedNodes, edges: selectedEdges } =
      selection.selectedItems;

    if (selectedNodes.length > 0) {
      // Remove edges connected to selected nodes
      edgeManagement.removeEdgesForNodes(selectedNodes);
      // Remove selected nodes
      nodeManagement.removeNodes(selectedNodes);
    }

    if (selectedEdges.length > 0) {
      edgeManagement.removeEdges(selectedEdges);
    }

    selection.clearSelection();
  }, [selection, nodeManagement, edgeManagement]);

  // Auto layout with improved positioning
  const applyAutoLayout = useCallback(() => {
    const layoutedNodes = applyBestLayout(
      nodeManagement.nodes,
      edgeManagement.edges,
      canvasState.canvasState.canvasSize
    );

    nodeManagement.setNodes(layoutedNodes);

    // Fit to view after layout
    setTimeout(() => {
      canvasState.fitToView(layoutedNodes, 50);
    }, 100);
  }, [nodeManagement, edgeManagement, canvasState]);

  // Clear everything
  const clearAll = useCallback(() => {
    if (window.confirm("Are you sure you want to clear everything?")) {
      nodeManagement.clearNodes();
      edgeManagement.clearEdges();
      selection.clearSelection();
      canvasState.resetView();
    }
  }, [nodeManagement, edgeManagement, selection, canvasState]);

  // Selection helpers
  const selectItem = useCallback(
    (type: "node" | "edge", id: string, multiSelect = false) => {
      if (type === "node") {
        selection.selectNode(id, multiSelect);
      } else {
        selection.selectEdge(id, multiSelect);
      }
    },
    [selection]
  );

  // Enhanced keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "Delete":
        case "Backspace":
          if (selection.hasSelection()) {
            deleteSelectedItems();
          }
          break;
        case "Escape":
          selection.clearSelection();
          break;
        case "a":
        case "A":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            selection.selectAll(
              nodeManagement.nodes.map((n) => n.id),
              edgeManagement.edges.map((e) => e.id)
            );
          }
          break;
        case "=":
        case "+":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            canvasState.zoomIn();
          }
          break;
        case "-":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            canvasState.zoomOut();
          }
          break;
        case "0":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            canvasState.resetZoom();
          }
          break;
        case "l":
        case "L":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (nodeManagement.nodes.length >= 2) {
              applyAutoLayout();
            }
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selection,
    deleteSelectedItems,
    nodeManagement,
    edgeManagement,
    canvasState,
    applyAutoLayout,
  ]);

  const selectionCount = selection.getSelectionCount();

  return (
    <div className="flex h-full">
      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <Canvas
          ref={canvasRef}
          nodes={nodeManagement.nodes}
          edges={edgeManagement.edges}
          selectedItems={selection.selectedItems}
          dragState={dragState}
          onNodePositionUpdate={nodeManagement.updateNodePosition}
          onEdgeCreate={edgeManagement.addEdge}
          onItemSelect={selectItem}
          onClearSelection={selection.clearSelection}
          onDragStateChange={setDragState}
        />

        {/* Floating Controls */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <Button
            onClick={addNode}
            icon={Plus}
            variant="primary"
            tooltip="Add Node"
          >
            Add Node
          </Button>

          <Button
            onClick={applyAutoLayout}
            icon={Layout}
            variant="secondary"
            tooltip="Auto Layout - Arrange nodes automatically (Ctrl+L)"
            disabled={nodeManagement.nodes.length < 2}
          >
            Auto Layout
          </Button>

          <Button
            onClick={deleteSelectedItems}
            icon={Trash2}
            variant="danger"
            tooltip="Delete Selected (Del/Backspace)"
            disabled={!selection.hasSelection()}
          >
            Delete {selectionCount.total > 0 && `(${selectionCount.total})`}
          </Button>

          <Button
            onClick={clearAll}
            icon={RotateCcw}
            variant="secondary"
            tooltip="Clear Everything"
            disabled={nodeManagement.nodes.length === 0}
          >
            Clear All
          </Button>
        </div>

        {/* Canvas Info */}
        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              Nodes: {nodeManagement.nodes.length} | Edges:{" "}
              {edgeManagement.edges.length}
            </div>
            {selectionCount.total > 0 && (
              <div className="text-blue-600">
                Selected: {selectionCount.nodes}N + {selectionCount.edges}E
              </div>
            )}
          </div>
        </div>

        {/* Canvas Controls */}
        <CanvasControls
          canvasState={canvasState.canvasState}
          onZoomIn={canvasState.zoomIn}
          onZoomOut={canvasState.zoomOut}
          onFitView={() => canvasState.fitToView(nodeManagement.nodes)}
          onResetView={canvasState.resetView}
          onPanReset={canvasState.resetPan}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Status Panel */}
        <div className="p-4 border-b border-gray-200">
          <StatusPanel validation={validation} />
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => canvasState.fitToView(nodeManagement.nodes)}
              variant="secondary"
              className="text-xs !py-1"
              disabled={nodeManagement.nodes.length === 0}
            >
              Fit View
            </Button>
            <Button
              onClick={() => setShowJSONPreview(!showJSONPreview)}
              icon={Download}
              variant="secondary"
              className="text-xs !py-1"
            >
              {showJSONPreview ? "Hide" : "Show"} JSON
            </Button>
          </div>
        </div>

        {/* JSON Preview */}
        {showJSONPreview && (
          <div className="flex-1 overflow-hidden">
            <JSONPreview
              nodes={nodeManagement.nodes}
              edges={edgeManagement.edges}
            />
          </div>
        )}

        {/* Enhanced Help Text */}
        <div className="p-4 text-xs text-gray-500 border-t border-gray-200 space-y-2">
          <div>
            <strong>How to Use:</strong>
          </div>
          <ul className="space-y-1">
            <li>
              • <strong>Add nodes:</strong> Click "Add Node" button
            </li>
            <li>
              • <strong>🎯 Drag nodes:</strong> Click and drag any node to move
              it
            </li>
            <li>
              • <strong>Connect:</strong> Drag from green to blue dots
            </li>
            <li>
              • <strong>Select:</strong> Click items (Shift for multi-select)
            </li>
            <li>
              • <strong>Delete:</strong> Select items and press Delete key
            </li>
          </ul>

          <div className="pt-2">
            <strong>Keyboard Shortcuts:</strong>
          </div>
          <ul className="space-y-1">
            <li>
              • <kbd className="bg-gray-100 px-1 rounded">Del</kbd> Delete
              selected
            </li>
            <li>
              • <kbd className="bg-gray-100 px-1 rounded">Ctrl+A</kbd> Select
              all
            </li>
            <li>
              • <kbd className="bg-gray-100 px-1 rounded">Esc</kbd> Clear
              selection
            </li>
            <li>
              • <kbd className="bg-gray-100 px-1 rounded">Ctrl+L</kbd> Auto
              layout
            </li>
            <li>
              • <kbd className="bg-gray-100 px-1 rounded">Ctrl +/-</kbd> Zoom
              in/out
            </li>
            <li>
              • <kbd className="bg-gray-100 px-1 rounded">Ctrl+0</kbd> Reset
              zoom
            </li>
          </ul>

          <div className="pt-2">
            <strong>Connection Rules:</strong>
          </div>
          <ul className="space-y-1">
            <li>• 🟢 Green dots: Start connections (outgoing)</li>
            <li>• 🔵 Blue dots: End connections (incoming)</li>
            <li>• ❌ No self-loops or cycles allowed</li>
            <li>• ✅ Drag nodes anywhere on canvas</li>
          </ul>

          <div className="pt-2">
            <strong>Tips:</strong>
          </div>
          <ul className="space-y-1">
            <li>• Nodes snap to canvas boundaries</li>
            <li>• Green highlight shows valid connection targets</li>
            <li>• Use Auto Layout to organize your graph</li>
            <li>• Export JSON structure for external use</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PipelineEditor;
