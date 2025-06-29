# Pipeline Editor (DAG Builder)

A React-TypeScript application for creating and managing Directed Acyclic Graphs (DAGs) with visual node-based editing, real-time validation, and advanced layout algorithms.

## 🚀 Live Demo

**[https://nexstern.vercel.app/](https://nexstern.vercel.app/)**

### Demo Videos
- [Basic Operations Demo](https://www.loom.com/share/5f4bd711c7424e709f0bb75ddf59fc19?sid=bed3c3ec-6acb-479e-ae57-6a48675049c4)

### Screenshots

![Main Interface](![alt text](image.png))

![Validation](![alt text](image-1.png))

## ⚡ Setup Instructions

### Prerequisites
- Node.js 16.8+
- npm 7+

### Installation

```bash
git clone https://github.com/username/pipeline-editor.git
cd pipeline-editor
npm install
npm run dev
```

Open http://localhost:5173

### Build & Deploy

```bash
npm run build
npm run preview
```

### Project Structure

```
src/
├── components/
│   ├── Canvas/Canvas.tsx
│   ├── Node/Node.tsx
│   ├── Edge/Edge.tsx
│   ├── UI/ContextMenu.tsx
│   └── PipelineEditor/PipelineEditor.tsx
├── hooks/
│   ├── useDAGValidation.ts
│   ├── useNodeManagement.ts
│   └── useEdgeManagement.ts
├── utils/
│   ├── layoutUtils.ts
│   └── geometryUtils.ts
├── types/dag.ts
```

## 📚 Libraries & Technical Decisions

### Core Stack
- **React 18.2.0** - Modern hooks, concurrent features
- **TypeScript 5.0.2** - Type safety, developer experience
- **Vite 4.4.5** - Fast HMR, modern build tool
- **Tailwind CSS 3.3.0** - Utility-first styling

### Specialized Libraries
- **Dagre 0.8.5** - Industry-standard graph layout algorithms
- **Lucide React 0.263.1** - Consistent icon system
- **@types/dagre** - TypeScript support for Dagre

### Key Architectural Decisions

#### Hook-Based State Management
```typescript
const nodeManagement = useNodeManagement([]);
const edgeManagement = useEdgeManagement([], nodeManagement.nodes);
const selection = useSelection();
```
Chose custom hooks over Redux for modularity without complexity.

#### Canvas-Relative Coordinates
```typescript
const canvasRect = canvasContainer.getBoundingClientRect();
const position = {
  x: e.clientX - canvasRect.left,
  y: e.clientY - canvasRect.top
};
```
Enables zoom, pan, and responsive layouts.

#### SVG for Edge Rendering
```typescript
<svg>
  <path d={pathString} markerEnd="url(#arrow)" />
</svg>
```
Vector graphics scale perfectly, support complex paths.

#### Real-Time Validation
```typescript
const validation = useDAGValidation(nodes, edges);
```
Immediate feedback prevents invalid states.

## 🚧 Challenges & Solutions

### 1. Canvas Coordinate Transformation

**Problem**: Mouse events needed transformation between screen and canvas coordinates with zoom/pan support.

**Solution**:
```typescript
const canvasRect = canvasContainer.getBoundingClientRect();
const canvasPosition = {
  x: e.clientX - canvasRect.left,
  y: e.clientY - canvasRect.top
};
```

**Learning**: Establish consistent coordinate systems early in graphics applications.

### 2. Smooth Node Dragging

**Problem**: Initial implementation was jittery, nodes jumped to mouse position.

**Solution**:
```typescript
const dragOffset = {
  x: e.clientX - nodeRect.left,
  y: e.clientY - nodeRect.top
};

const newPosition = {
  x: e.clientX - canvasRect.left - dragOffset.x,
  y: e.clientY - canvasRect.top - dragOffset.y
};
```

**Learning**: Smooth interactions require careful offset calculations.

### 3. Edge Connection Validation

**Problem**: Users could create invalid connections causing confusing UI states.

**Solution**:
```typescript
const validateConnection = (sourceId, targetId, sourceSide) => {
  if (sourceSide !== 'right') return { valid: false };
  if (sourceId === targetId) return { valid: false };
  return { valid: true };
};
```

**Learning**: Immediate validation prevents user confusion.

### 4. DAG Cycle Detection

**Problem**: Real-time cycle detection in directed graphs is computationally complex.

**Solution**:
```typescript
function detectCycle(nodes, edges) {
  const visited = new Set();
  const recursionStack = new Set();
  
  function dfs(nodeId) {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    for (const neighbor of getNeighbors(nodeId)) {
      if (dfs(neighbor)) return true;
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
}
```

**Learning**: Classic algorithms (DFS) are optimal for graph problems.

### 5. Performance with Large Graphs

**Problem**: Rendering hundreds of nodes caused performance issues.

**Solution**:
```typescript
const Node = React.memo(({ node, ...props }) => { ... });

const updateNodePosition = useCallback((nodeId, position) => {
  setNodes(prev => prev.map(node => 
    node.id === nodeId ? { ...node, position } : node
  ));
}, []);
```

**Learning**: Performance requires profiling and targeted memoization.

### 6. Dagre Layout Integration

**Problem**: Dagre needed specific data format and coordinate adjustments.

**Solution**:
```typescript
const graph = new dagre.graphlib.Graph();
nodes.forEach(node => {
  graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
});

dagre.layout(graph);
const layoutedNodes = nodes.map(node => {
  const graphNode = graph.node(node.id);
  return {
    ...node,
    position: {
      x: graphNode.x - NODE_WIDTH / 2,
      y: graphNode.y - NODE_HEIGHT / 2
    }
  };
});
```

**Learning**: Third-party libraries require data transformation adapters.

### 7. Context Menu Positioning

**Problem**: Menus needed viewport boundary detection while appearing at cursor.

**Solution**:
```typescript
const adjustMenuPosition = (x, y, menuWidth, menuHeight, viewport) => {
  const adjustedX = x + menuWidth > viewport.width 
    ? viewport.width - menuWidth - 10 
    : x;
  const adjustedY = y + menuHeight > viewport.height 
    ? y - menuHeight 
    : y;
  return { x: adjustedX, y: adjustedY };
};
```

**Learning**: UI components need viewport-aware positioning.

## 📖 References

### Documentation
- [React 18 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Dagre Documentation](https://github.com/dagrejs/dagre)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

### Graph Theory
- [Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/books/introduction-algorithms) - Chapter 22
- [Graph Drawing Handbook](https://cs.brown.edu/people/rtamassi/gdhandbook/)
- [Dagre Algorithm Details](https://github.com/dagrejs/dagre/wiki)

### Performance & Best Practices
- [React Performance Guide](https://react.dev/learn/render-and-commit)
- [Web Performance](https://web.dev/performance/)
- [SVG Specification](https://www.w3.org/TR/SVG2/)

### Design Systems
- [Material Design](https://material.io/design)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Laws of UX](https://lawsofux.com/)

## Features

- Add/edit/delete nodes with 6 color-coded types
- Drag nodes with boundary constraints
- Create edges with validation
- Right-click context menus
- Visual highlighting of invalid connections
- Auto-layout with multiple algorithms
- Real-time DAG validation
- JSON export/import
- Keyboard shortcuts
- Zoom/pan controls
