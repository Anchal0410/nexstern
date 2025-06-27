import React from "react";
import PipelineEditor from "./components/PipelineEditor/PipelineEditor";
import "./index.css";

function App() {
  return (
    <div className="w-full h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Pipeline Editor (DAG Builder)
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Create and manage directed acyclic graphs for data pipelines
        </p>
      </header>

      <main className="h-[calc(100vh-80px)]">
        <PipelineEditor />
      </main>
    </div>
  );
}

export default App;
