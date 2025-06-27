import React from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { ValidationResult } from "../../types/dag";

interface StatusPanelProps {
  validation: ValidationResult;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ validation }) => {
  const { isValid, errors } = validation;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">DAG Status</h3>

      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        {isValid ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-700">
              Valid DAG
            </span>
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              Invalid DAG
            </span>
          </>
        )}
      </div>

      {/* Validation Rules Status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Validation Rules:</h4>

        <div className="space-y-1 text-xs">
          <ValidationRule
            label="At least 2 nodes"
            isValid={!errors.some((e) => e.includes("at least 2 nodes"))}
          />
          <ValidationRule
            label="No disconnected nodes"
            isValid={!errors.some((e) => e.includes("Disconnected nodes"))}
          />
          <ValidationRule
            label="No self-loops"
            isValid={!errors.some((e) => e.includes("Self-loops"))}
          />
          <ValidationRule
            label="No cycles"
            isValid={!errors.some((e) => e.includes("cycles"))}
          />
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-red-700 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            Issues:
          </h4>
          <ul className="text-xs text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Helper component for individual validation rules
const ValidationRule: React.FC<{ label: string; isValid: boolean }> = ({
  label,
  isValid,
}) => (
  <div className="flex items-center space-x-2">
    {isValid ? (
      <CheckCircle className="w-3 h-3 text-green-500" />
    ) : (
      <XCircle className="w-3 h-3 text-red-500" />
    )}
    <span className={isValid ? "text-green-700" : "text-red-700"}>{label}</span>
  </div>
);

export default StatusPanel;
