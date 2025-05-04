import React from "react";

export function ChartContainer({ config, className = '', children, ...props }) {
  return (
    <div className={`relative flex flex-col bg-card rounded-xl border p-6 shadow ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ChartTooltip({ content, ...props }) {
  // Przekazuje content do Recharts Tooltip
  return content;
}

export function ChartTooltipContent({ active, payload, label, indicator = "dot", labelKey, nameKey, hideLabel, hideIndicator }) {
  if (!active || !payload || !payload.length) return null;
  // Specjalny tooltip dla wykresu aktywności (nameKey === 'day')
  if (nameKey === 'day') {
    return (
      <div
        className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-2xl min-w-[140px] flex flex-col items-center animate-in fade-in-50"
        style={{ filter: 'drop-shadow(0 4px 24px rgba(80,80,120,0.10))' }}
      >
        <div className="mb-2 text-base font-semibold text-indigo-600 tracking-wide">{label}</div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-zinc-400 mb-1">Nowe zadania</span>
          <span className="text-3xl font-extrabold text-zinc-900">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  // Domyślny tooltip (np. dla statusów, kołowy)
  return (
    <div className="rounded-lg border bg-popover p-4 text-popover-foreground shadow-xl min-w-[180px]">
      {!hideLabel && (
        <div className="mb-2 text-sm font-medium text-muted-foreground">
          {labelKey ? payload[0].payload[labelKey] : label}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {!hideIndicator && (
              <span
                className={`inline-block w-3 h-3 rounded-full`}
                style={{ background: entry.color || entry.fill || '#8884d8' }}
              />
            )}
            <span className="text-sm font-medium">
              {nameKey ? entry.payload[nameKey] : entry.name}
            </span>
            <span className="ml-auto text-sm font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartLegend({ content, ...props }) {
  // Przekazuje content do Recharts Legend
  return content;
}

export function ChartLegendContent({ payload, nameKey }) {
  if (!payload) return null;
  return (
    <div className="flex gap-4 mt-2">
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: entry.color || entry.fill || '#8884d8' }} />
          <span className="text-xs font-medium text-muted-foreground">
            {nameKey ? entry.payload[nameKey] : entry.value || entry.dataKey}
          </span>
        </div>
      ))}
    </div>
  );
} 