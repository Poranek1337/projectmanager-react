import * as React from "react";

export function Badge({ children, className = "", ...props }) {
  return (
    <span className={`inline-block rounded-full bg-indigo-100 text-indigo-800 px-3 py-1 text-xs font-semibold ${className}`} {...props}>
      {children}
    </span>
  );
} 