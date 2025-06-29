import React, { useCallback, useRef, useEffect } from "react";
import { Plus, Layout, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react";
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
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const nodeManagement = useNodeManagement([]);
  const edgeManagement = useEdgeManagement([], nodeManagement.nodes);
  const selection = useSelection();
  const canvasState = useCanvasState();
  const validation = useDAGValidation(
    nodeManagement.nodes,
    edgeManagement.edges
  );

  // Local state
  const [dragState, setDragState] = React.useState<DragState>({
    isDragging: false,
    dragType: null,
    dragData: null,
    startPosition: null,
    currentPosition: null,
  });

  // JSON Preview state - Fixed with proper state management
  const [showJSONPreview, setShowJSONPreview] = React.useState(false);

  // Toggle JSON Preview function
  const toggleJSONPreview = useCallback(() => {
    setShowJSONPreview((prev) => {
      console.log("Toggling JSON preview:", !prev); // Debug log
      return !prev;
    });
  }, []);

  // Update canvas size when component mounts or resizes
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
      const position = findNonOverlappingPosition(nodeManagement.nodes, {
        x: Math.random() * 300 + 100,
        y: Math.random() * 200 + 100,
      });

      const newNode = nodeManagement.addNode(undefined, position);
      selection.clearSelection();
      selection.selectNode(newNode.id);
    } catch (error) {
      console.log("Node creation cancelled");
    }
  }, [nodeManagement, selection]);

  const deleteSelectedItems = useCallback(() => {
    const { nodes: selectedNodes, edges: selectedEdges } =
      selection.selectedItems;

    if (selectedNodes.length > 0) {
      edgeManagement.removeEdgesForNodes(selectedNodes);
      nodeManagement.removeNodes(selectedNodes);
    }

    if (selectedEdges.length > 0) {
      edgeManagement.removeEdges(selectedEdges);
    }

    selection.clearSelection();
  }, [selection, nodeManagement, edgeManagement]);

  // Auto layout
  const applyAutoLayout = useCallback(() => {
    const layoutedNodes = applyBestLayout(
      nodeManagement.nodes,
      edgeManagement.edges,
      canvasState.canvasState.canvasSize
    );

    nodeManagement.setNodes(layoutedNodes);

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

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
        case "j":
        case "J":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            toggleJSONPreview();
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
    toggleJSONPreview,
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
            tooltip="Auto Layout - Arrange nodes automatically"
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
      <div
        className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${
          showJSONPreview ? "w-96" : "w-80"
        }`}
      >
        {/* Status Panel */}
        <div className="p-4 border-b border-gray-200">
          <StatusPanel validation={validation} />
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Quick Actions</h4>

          {/* Main action buttons */}
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
              onClick={applyAutoLayout}
              variant="secondary"
              className="text-xs !py-1"
              disabled={nodeManagement.nodes.length < 2}
            >
              Layout
            </Button>
          </div>

          {/* JSON Preview Toggle - Fixed */}
          <div className="pt-2">
            <Button
              onClick={toggleJSONPreview}
              icon={showJSONPreview ? EyeOff : Eye}
              variant={showJSONPreview ? "primary" : "secondary"}
              className="w-full text-xs !py-2"
              tooltip={`${
                showJSONPreview ? "Hide" : "Show"
              } JSON Preview (Ctrl+J)`}
            >
              {showJSONPreview ? "Hide JSON Preview" : "Show JSON Preview"}
            </Button>
          </div>
        </div>

        {/* JSON Preview - Fixed conditional rendering */}
        {showJSONPreview && (
          <div className="flex-1 overflow-hidden border-t border-gray-200">
            <JSONPreview
              nodes={nodeManagement.nodes}
              edges={edgeManagement.edges}
              isVisible={showJSONPreview}
            />
          </div>
        )}

        {/* Help Text - Only show when JSON is hidden */}
        {!showJSONPreview && (
          <div className="p-4 text-xs text-gray-500 border-t border-gray-200 space-y-2">
            <div>
              <strong>How to Use:</strong>
            </div>
            <ul className="space-y-1">
              <li>
                • <strong>Add nodes:</strong> Click "Add Node" button
              </li>
              <li>
                • <strong>🎯 Drag nodes:</strong> Click and drag any node to
                move it
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
                • <kbd className="bg-gray-100 px-1 rounded">Ctrl+J</kbd> Toggle
                JSON
              </li>
              <li>
                • <kbd className="bg-gray-100 px-1 rounded">Ctrl +/-</kbd> Zoom
                in/out
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineEditor;
