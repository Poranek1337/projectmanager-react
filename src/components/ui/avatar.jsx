import * as React from "react";

export function Avatar({ children, className = "", ...props }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-gray-200 ${className}`} {...props}>
      {children}
    </span>
  );
}

export function AvatarImage({ src, alt = "", className = "" }) {
  return <img src={src} alt={alt} className={`rounded-full object-cover ${className}`} />;
}

export function AvatarFallback({ children, className = "" }) {
  return <span className={`text-gray-500 ${className}`}>{children}</span>;
} 