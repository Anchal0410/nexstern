import React from "react";
import { Copy, Check } from "lucide-react";
import type { DAGNode, DAGEdge } from "../../types/dag";

interface JSONPreviewProps {
  nodes: DAGNode[];
  edges: DAGEdge[];
}

const JSONPreview: React.FC<JSONPreviewProps> = ({ nodes, edges }) => {
  const [copied, setCopied] = React.useState(false);

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
    },
  };

  const jsonString = JSON.stringify(dagData, null, 2);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">DAG Structure</h4>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
          title="Copy JSON"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};

export default JSONPreview;
