'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import type { Athlete, Metric } from '@/types';

interface PerformanceHeatmapProps {
  athletes: Athlete[];
  metrics: Metric[];
  heatmapData: Record<string, Record<string, number | null>>;
}

function normalizeScores(
  athletes: Athlete[],
  metrics: Metric[],
  heatmapData: Record<string, Record<string, number | null>>
): Record<string, Record<string, number | null>> {
  const normalized: Record<string, Record<string, number | null>> = {};

  for (const metric of metrics) {
    // Get all scores for this metric
    const scores: number[] = [];
    for (const athlete of athletes) {
      const val = heatmapData[athlete.id]?.[metric.id];
      if (val != null) scores.push(val);
    }

    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min;

    for (const athlete of athletes) {
      if (!normalized[athlete.id]) normalized[athlete.id] = {};
      const val = heatmapData[athlete.id]?.[metric.id];
      if (val != null && range > 0) {
        normalized[athlete.id][metric.id] = (val - min) / range;
      } else if (val != null) {
        normalized[athlete.id][metric.id] = 1;
      } else {
        normalized[athlete.id][metric.id] = null;
      }
    }
  }

  return normalized;
}

export function PerformanceHeatmap({ athletes, metrics, heatmapData }: PerformanceHeatmapProps) {
  const normalized = useMemo(
    () => normalizeScores(athletes, metrics, heatmapData),
    [athletes, metrics, heatmapData]
  );

  if (metrics.length === 0 || athletes.length === 0) {
    return (
      <Card>
        <h3 className="mb-2 text-sm font-semibold text-black">Performance Heatmap</h3>
        <p className="text-sm text-gray-400">No data available for heatmap</p>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="p-4 pb-2">
        <h3 className="text-sm font-semibold text-black">Performance Heatmap</h3>
        <p className="mt-0.5 text-xs text-gray-500">Darker = better relative score per metric</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 bg-white px-4 py-2 text-left font-medium text-gray-500">
                Athlete
              </th>
              {metrics.map((m) => (
                <th key={m.id} className="px-3 py-2 text-center font-medium text-gray-500 whitespace-nowrap">
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr key={athlete.id} className="border-b border-border last:border-0">
                <td className="sticky left-0 bg-white px-4 py-2 font-medium text-black whitespace-nowrap">
                  {athlete.name}
                </td>
                {metrics.map((metric) => {
                  const rawValue = heatmapData[athlete.id]?.[metric.id];
                  const intensity = normalized[athlete.id]?.[metric.id];
                  const opacity = intensity != null ? 0.1 + intensity * 0.6 : 0;

                  return (
                    <td
                      key={metric.id}
                      className="px-3 py-2 text-center"
                      style={{
                        backgroundColor: intensity != null
                          ? `rgba(0, 0, 0, ${opacity})`
                          : 'transparent',
                        color: intensity != null && intensity > 0.5 ? '#fff' : '#000',
                      }}
                    >
                      {rawValue != null ? rawValue : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
