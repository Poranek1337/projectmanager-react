import React from "react";

export default function ErrorMessage({ children, className = "" }) {
  if (!children) return null;
  return (
    <div className={`text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm my-2 ${className}`} role="alert">
      {children}
    </div>
  );
} 