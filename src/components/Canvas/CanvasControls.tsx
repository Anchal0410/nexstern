import React from "react";
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";
import type { CanvasState } from "../../types/dag";
import Button from "../UI/Button";

interface CanvasControlsProps {
  canvasState: CanvasState;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetView: () => void;
  onPanReset: () => void;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  canvasState,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetView,
  onPanReset,
}) => {
  const zoomPercentage = Math.round(canvasState.zoom * 100);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          onClick={onZoomOut}
          icon={ZoomOut}
          variant="secondary"
          disabled={canvasState.zoom <= 0.1}
          tooltip="Zoom Out"
          className="!p-2"
        >
          {null}
        </Button>

        <div className="px-2 py-1 text-xs font-mono min-w-[50px] text-center bg-gray-50 rounded">
          {zoomPercentage}%
        </div>

        <Button
          onClick={onZoomIn}
          icon={ZoomIn}
          variant="secondary"
          disabled={canvasState.zoom >= 3}
          tooltip="Zoom In"
          className="!p-2"
        >
          {null}
        </Button>
      </div>

      {/* View Controls */}
      <div className="flex gap-1">
        <Button
          onClick={onFitView}
          icon={Maximize}
          variant="secondary"
          tooltip="Fit to View"
          className="!p-2 !px-3 text-xs"
        >
          Fit
        </Button>

        <Button
          onClick={onResetView}
          icon={RotateCcw}
          variant="secondary"
          tooltip="Reset View"
          className="!p-2"
        >
          {null}
        </Button>
      </div>

      {/* Pan Info */}
      {(canvasState.pan.x !== 0 || canvasState.pan.y !== 0) && (
        <div className="border-t border-gray-200 pt-2">
          <div className="text-xs text-gray-500 text-center mb-1">
            Pan Offset
          </div>
          <div className="text-xs font-mono text-center">
            x: {Math.round(canvasState.pan.x)}, y:{" "}
            {Math.round(canvasState.pan.y)}
          </div>
          <Button
            onClick={onPanReset}
            variant="secondary"
            className="!p-1 !px-2 text-xs w-full mt-1"
          >
            Reset Pan
          </Button>
        </div>
      )}
    </div>
  );
};

export default CanvasControls;
