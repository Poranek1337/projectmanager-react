import * as React from "react";

export function Select({ value, onChange, children, ...props }) {
  return (
    <select
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-900 dark:text-white"
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, ...props }) {
  return (
    <div {...props} className="border rounded px-3 py-2 cursor-pointer bg-white dark:bg-zinc-900 dark:text-white">
      {children}
    </div>
  );
}

export function SelectContent({ children, ...props }) {
  return (
    <div {...props} className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-900 border rounded shadow-lg">
      {children}
    </div>
  );
}

export function SelectItem({ value, children, ...props }) {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  );
}

export function SelectValue({ children }) {
  return <span>{children}</span>;
} 