import * as React from "react";

export function Table({ children, className = "", ...props }) {
  return (
    <table className={`min-w-full border-collapse ${className}`} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ children }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }) {
  return <tr className="border-b">{children}</tr>;
}

export function TableCell({ children }) {
  return <td className="px-4 py-2">{children}</td>;
}

export function TableHead({ children }) {
  return <th className="px-4 py-2 text-left font-semibold">{children}</th>;
} 