'use client';

import type { Metric } from '@/types';

interface MetricSlicerProps {
  metrics: Metric[];
  value: string;
  onChange: (metricId: string) => void;
}

export function MetricSlicer({ metrics, value, onChange }: MetricSlicerProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-black focus:border-black focus:outline-none"
    >
      {metrics.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name} ({m.unit})
        </option>
      ))}
    </select>
  );
}
