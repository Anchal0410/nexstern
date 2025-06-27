import React from "react";
import type { LucideIcon } from "lucide-react";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  tooltip?: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  icon: Icon,
  variant = "secondary",
  disabled = false,
  tooltip,
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:hover:bg-white",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title={tooltip}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

export default Button;
