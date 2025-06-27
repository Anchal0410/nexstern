# Pipeline Editor (DAG Builder)

A React-TypeScript application for creating and managing Directed Acyclic Graphs (DAGs) with visual node-based editing.

## 🚀 Features

### Core Requirements ✅
- **Add Nodes**: Click "Add Node" button with custom name prompts
- **Draw Edges**: Drag from green (outgoing) to blue (incoming) connection points  
- **Connection Rules**: Enforced outgoing→incoming direction, no self-loops
- **Delete Items**: Delete key removes selected nodes/edges
- **DAG Validation**: Real-time validation with detailed status messages

### Advanced Features ✅
- **Auto Layout**: Intelligent layout using Dagre library with multiple algorithms
- **Multi-Selection**: Ctrl/Shift+Click for selecting multiple items
- **Keyboard Shortcuts**: Full keyboard navigation and control
- **Canvas Controls**: Zoom in/out, pan, fit-to-view, reset view
- **JSON Export**: Live preview and copy-to-clipboard functionality
- **Visual Feedback**: Selection indicators, hover effects, connection previews

## 🛠 Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Dagre** for automatic graph layout
- **Lucide React** for icons
- **Vite** for development and building


## 🎮 Controls

### Mouse Controls
- **Click**: Select nodes/edges
- **Shift+Click**: Multi-select
- **Drag nodes**: Move position
- **Drag green→blue**: Create connections

### Keyboard Shortcuts
- **Delete/Backspace**: Delete selected items
- **Ctrl+A**: Select all
- **Esc**: Clear selection
- **Ctrl +/-**: Zoom in/out
- **Ctrl+0**: Reset zoom

### UI Controls
- **Add Node**: Create new node with custom name
- **Auto Layout**: Apply intelligent automatic arrangement
- **Delete**: Remove selected items
- **Clear All**: Reset entire canvas
- **Fit View**: Zoom to fit all nodes
- **JSON Preview**: Export/view DAG structure

## ✅ DAG Validation Rules

The pipeline validates in real-time against these rules:

1. **Minimum 2 nodes** required
2. **No cycles** (uses DFS cycle detection)
3. **All nodes connected** to at least one edge
4. **Proper edge direction** (outgoing→incoming only)
5. **No self-loops** allowed

## 🎨 Layout Algorithms

The auto-layout feature includes multiple algorithms:

- **Dagre Layout**: Professional graph layout using Dagre
- **Hierarchical**: Top-down tree-like structures
- **Circular**: Nodes arranged in a circle
- **Grid**: Simple grid arrangement
- **Smart Detection**: Automatically chooses best layout

## 🏗 Installation & Setup

```bash
# Create project
npm create vite@latest pipeline-editor -- --template react-ts
cd pipeline-editor

# Install dependencies
npm install dagre @types/dagre lucide-react

# Install Tailwind CSS
npm install -D tailwindcss autoprefixer
npx tailwindcss init -p

# Development
npm run dev

# Build
npm run build
```

## 🔧 Key Design Decisions

### Architecture
- **Hook-based state management** for modularity
- **Compound component pattern** for Canvas/Node/Edge
- **Separation of concerns** between UI and business logic
- **TypeScript throughout** for type safety

### User Experience
- **Visual connection points** (green=outgoing, blue=incoming)
- **Real-time validation feedback** with clear error messages
- **Progressive disclosure** with collapsible panels
- **Keyboard-first design** with comprehensive shortcuts

### Performance
- **Efficient re-rendering** with React.memo and useCallback
- **Optimized SVG rendering** for edges
- **Debounced layout calculations**
- **Canvas virtualization** ready for large graphs

## 📋 Assignment Requirements Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Add Node | ✅ | Button + prompt with custom names |
| Draw Edges | ✅ | Drag from right→left connection points |
| Connection Rules | ✅ | Enforced outgoing→incoming, no self-loops |
| Delete with Delete Key | ✅ | Keyboard event handling |
| DAG Validation | ✅ | Real-time validation with status display |
| Bonus: Auto Layout | ✅ | Dagre integration with multiple algorithms |
| React + TypeScript | ✅ | Full TypeScript implementation |
| Modular Code | ✅ | Hook-based architecture |
| Clean UX | ✅ | Modern design with keyboard shortcuts |

## 🚀 Future Enhancements

- **Right-click context menus**
- **Undo/Redo functionality**
- **Node templates and types**
- **Import/Export multiple formats**
- **Collaborative editing**
- **Performance optimization for large graphs**
- **Custom layout algorithms**
- **Accessibility improvements**

## 📝 Notes

This implementation follows modern React patterns with hooks, TypeScript for type safety, and Tailwind for styling. The modular architecture makes it easy to extend with new features while maintaining clean separation of concerns.

The DAG validation uses a depth-first search algorithm for cycle detection and comprehensive