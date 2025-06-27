import { useState, useCallback } from "react";
import type { CanvasState, Position, DAGNode } from "../types/dag";
import { calculateBoundingBox } from "../utils/geometryUtils";

interface UseCanvasStateReturn {
  canvasState: CanvasState;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
  pan: (delta: Position) => void;
  setPan: (pan: Position) => void;
  resetPan: () => void;
  resetView: () => void;
  fitToView: (nodes: DAGNode[], padding?: number) => void;
  updateCanvasSize: (size: { width: number; height: number }) => void;
}

const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export const useCanvasState = (
  initialCanvasSize: { width: number; height: number } = {
    width: 800,
    height: 600,
  }
): UseCanvasStateReturn => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: DEFAULT_ZOOM,
    pan: { x: 0, y: 0 },
    canvasSize: initialCanvasSize,
  });

  const zoomIn = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom + ZOOM_STEP, MAX_ZOOM),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom - ZOOM_STEP, MIN_ZOOM),
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    setCanvasState((prev) => ({
      ...prev,
      zoom: clampedZoom,
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      zoom: DEFAULT_ZOOM,
    }));
  }, []);

  const pan = useCallback((delta: Position) => {
    setCanvasState((prev) => ({
      ...prev,
      pan: {
        x: prev.pan.x + delta.x,
        y: prev.pan.y + delta.y,
      },
    }));
  }, []);

  const setPan = useCallback((newPan: Position) => {
    setCanvasState((prev) => ({
      ...prev,
      pan: newPan,
    }));
  }, []);

  const resetPan = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      pan: { x: 0, y: 0 },
    }));
  }, []);

  const resetView = useCallback(() => {
    setCanvasState((prev) => ({
      ...prev,
      zoom: DEFAULT_ZOOM,
      pan: { x: 0, y: 0 },
    }));
  }, []);

  const fitToView = useCallback(
    (nodes: DAGNode[], padding: number = 50) => {
      if (nodes.length === 0) {
        resetView();
        return;
      }

      const boundingBox = calculateBoundingBox(nodes);
      const { canvasSize } = canvasState;

      // Calculate available space
      const availableWidth = canvasSize.width - padding * 2;
      const availableHeight = canvasSize.height - padding * 2;

      // Calculate scale to fit content
      const scaleX = availableWidth / boundingBox.width;
      const scaleY = availableHeight / boundingBox.height;
      const newZoom = Math.min(scaleX, scaleY, MAX_ZOOM);

      // Calculate pan to center content
      const scaledWidth = boundingBox.width * newZoom;
      const scaledHeight = boundingBox.height * newZoom;

      const newPan = {
        x: (canvasSize.width - scaledWidth) / 2 - boundingBox.minX * newZoom,
        y: (canvasSize.height - scaledHeight) / 2 - boundingBox.minY * newZoom,
      };

      setCanvasState((prev) => ({
        ...prev,
        zoom: Math.max(newZoom, MIN_ZOOM),
        pan: newPan,
      }));
    },
    [canvasState, resetView]
  );

  const updateCanvasSize = useCallback(
    (size: { width: number; height: number }) => {
      setCanvasState((prev) => ({
        ...prev,
        canvasSize: size,
      }));
    },
    []
  );

  return {
    canvasState,
    zoomIn,
    zoomOut,
    setZoom,
    resetZoom,
    pan,
    setPan,
    resetPan,
    resetView,
    fitToView,
    updateCanvasSize,
  };
};
