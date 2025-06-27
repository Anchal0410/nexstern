export interface Position {
  x: number;
  y: number;
}

export interface DAGNode {
  id: string;
  label: string;
  position: Position;
  selected: boolean;
}

export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  selected: boolean;
}

export interface DAGData {
  nodes: DAGNode[];
  edges: DAGEdge[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ConnectionPoint {
  nodeId: string;
  side: "left" | "right";
  position: Position;
}

export interface DragState {
  isDragging?: boolean;
  dragType?: "node" | "connection" | null;
  dragData?: any;
  startPosition?: Position | null;
  currentPosition: Position | null;
}

export interface CanvasState {
  zoom: number;
  pan: Position;
  canvasSize: { width: number; height: number };
}

// Layout types for dagre
export interface LayoutOptions {
  direction: "TB" | "LR" | "BT" | "RL";
  nodeWidth: number;
  nodeHeight: number;
  rankSep: number;
  nodeSep: number;
}
