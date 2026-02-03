import React from "react";
import { Loader2, RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "blue" | "green" | "red" | "purple" | "gray" | "orange";
  text?: string;
  fullScreen?: boolean;
  variant?: "default" | "dots" | "pulse" | "spinner";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "blue",
  text,
  fullScreen = false,
  variant = "default",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    gray: "text-gray-600",
    orange: "text-orange-600",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const renderSpinner = () => {
    const dotColors = {
      blue: "bg-blue-600",
      green: "bg-green-600",
      red: "bg-red-600",
      purple: "bg-purple-600",
      gray: "bg-gray-600",
      orange: "bg-orange-600",
    };

    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 ${dotColors[color]} rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        );

      case "pulse":
        return (
          <div
            className={`${sizeClasses[size]} ${colorClasses[color]} animate-pulse`}
          >
            <div className="w-full h-full bg-current rounded-full"></div>
          </div>
        );

      case "spinner":
        return (
          <RefreshCw
            className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
          />
        );

      default:
        return (
          <Loader2
            className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
          />
        );
    }
  };

  const textColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    gray: "text-gray-600",
    orange: "text-orange-600",
  };

  const spinnerElement = (
    <div className="flex flex-col items-center justify-center space-y-3">
      {renderSpinner()}
      {text && (
        <p
          className={`${textColorClasses[color]} ${textSizeClasses[size]} font-medium animate-pulse text-center`}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100 max-w-sm w-full mx-4">
          {spinnerElement}
        </div>
      </div>
    );
  }

  return spinnerElement;
};

// Enhanced Page Loading Component
export const PageLoader: React.FC<{ text?: string; compact?: boolean }> = ({
  text = "Memuat...",
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-white rounded-lg shadow-md p-6 border max-w-sm w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">{text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-2 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 text-lg font-medium">{text}</p>
        </div>
      </div>
    </div>
  );
};

// Enhanced Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 7,
}) => (
  <div className="animate-pulse">
    {/* Table Header */}
    <div className="bg-gray-50 border-b border-gray-200">
      <div
        className="grid gap-4 p-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-300 rounded-md"></div>
        ))}
      </div>
    </div>

    {/* Table Body */}
    <div className="bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid gap-4 p-4 border-b border-gray-100"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-gray-200 rounded"
              style={{ animationDelay: `${(i + j) * 0.05}s` }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Enhanced Card Skeleton
export const CardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-gray-300 rounded-md w-1/3"></div>
        <div className="h-10 w-10 bg-gray-300 rounded-xl"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded-md w-2/3 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-2"></div>
      <div className="flex items-center mt-3">
        <div className="h-3 w-3 bg-gray-300 rounded-full mr-2"></div>
        <div className="h-3 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
  </div>
);

// Enhanced Chart Skeleton
export const ChartSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-300 rounded-md w-1/3"></div>
        <div className="h-4 w-4 bg-gray-300 rounded"></div>
      </div>

      {/* Chart Area */}
      <div className="h-80 bg-gray-50 rounded-lg flex items-end justify-between p-6 space-x-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-300 rounded-t-md flex-1 animate-pulse"
            style={{
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center mt-4 space-x-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
            <div className="h-3 bg-gray-300 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Form Loading Overlay
export const FormLoadingOverlay: React.FC<{ text?: string }> = ({
  text = "Menyimpan data...",
}) => (
  <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-blue-600 font-medium">{text}</p>
    </div>
  </div>
);
