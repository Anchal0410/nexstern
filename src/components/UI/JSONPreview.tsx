import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { DAGNode, DAGEdge } from "../../types/dag";

interface JSONPreviewProps {
  nodes: DAGNode[];
  edges: DAGEdge[];
  isVisible?: boolean;
}

const JSONPreview: React.FC<JSONPreviewProps> = ({
  nodes,
  edges,
  isVisible = true,
}) => {
  const [copied, setCopied] = useState(false);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const dagData = {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.label,
      position: node.position,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
    metadata: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      timestamp: new Date().toISOString(),
      isValid: nodes.length >= 2 && edges.length > 0,
    },
    statistics: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      avgConnectionsPerNode:
        nodes.length > 0 ? ((edges.length * 2) / nodes.length).toFixed(2) : 0,
    },
  };

  const jsonString = JSON.stringify(dagData, null, 2);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = jsonString;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy to clipboard:", fallbackErr);
        alert("Failed to copy to clipboard. Please copy manually.");
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dag-structure-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div>
          <h4 className="text-sm font-medium text-gray-900">DAG Structure</h4>
          <p className="text-xs text-gray-500">
            {nodes.length} nodes, {edges.length} edges
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Copy JSON to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={downloadJSON}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Download JSON file"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* JSON Content */}
      <div className="flex-1 overflow-auto">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed p-4 bg-gray-50 border-r border-gray-200">
          {jsonString}
        </pre>
      </div>

      {/* Footer with stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>File size:</span>
            <span>{new Blob([jsonString]).size} bytes</span>
          </div>
          <div className="flex justify-between">
            <span>Last updated:</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JSONPreview;
