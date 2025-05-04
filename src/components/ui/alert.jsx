import * as React from "react";

export function Alert({ children, className = "", variant = "default", ...props }) {
  return (
    <div
      className={`relative w-full rounded-lg border p-4 ${variant === "destructive" ? "border-red-500 bg-red-50 text-red-900" : variant === "success" ? "border-green-500 bg-green-50 text-green-900" : "border-gray-200 bg-white"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ children, className = "" }) {
  return <div className={`font-bold mb-1 ${className}`}>{children}</div>;
}

export function AlertDescription({ children, className = "" }) {
  return <div className={`text-sm ${className}`}>{children}</div>;
} 