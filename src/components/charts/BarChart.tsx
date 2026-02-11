'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { CHART_GRID, getChartColor } from './chartColors';

interface BarConfig {
  key: string;
  color?: string;
  name?: string;
  stackId?: string;
}

interface AnalyticsBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: BarConfig[];
  height?: number;
  onClick?: (data: Record<string, unknown>) => void;
  layout?: 'horizontal' | 'vertical';
  cellColors?: string[];
}

export function AnalyticsBarChart({
  data,
  xKey,
  bars,
  height = 300,
  onClick,
  layout = 'horizontal',
  cellColors,
}: AnalyticsBarChartProps) {
  const isVertical = layout === 'vertical';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        onClick={onClick ? (e: Record<string, unknown>) => {
          const payload = e?.activePayload as { payload: Record<string, unknown> }[] | undefined;
          if (payload?.[0]) onClick(payload[0].payload);
        } : undefined}
        margin={{ top: 5, right: 20, bottom: 5, left: isVertical ? 80 : 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
        {isVertical ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12, fill: '#666' }} tickLine={false} axisLine={{ stroke: CHART_GRID }} />
            <YAxis type="category" dataKey={xKey} tick={{ fontSize: 12, fill: '#666' }} tickLine={false} axisLine={{ stroke: CHART_GRID }} width={75} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#666' }} tickLine={false} axisLine={{ stroke: CHART_GRID }} />
            <YAxis tick={{ fontSize: 12, fill: '#666' }} tickLine={false} axisLine={{ stroke: CHART_GRID }} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontSize: 12,
            color: '#000',
          }}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {bars.map((bar, i) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color || getChartColor(i)}
            name={bar.name || bar.key}
            stackId={bar.stackId}
            radius={[4, 4, 0, 0]}
            cursor={onClick ? 'pointer' : undefined}
          >
            {cellColors && data.map((_, idx) => (
              <Cell key={idx} fill={cellColors[idx] || getChartColor(i)} />
            ))}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
