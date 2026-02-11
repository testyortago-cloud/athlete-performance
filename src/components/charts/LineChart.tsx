'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_BLACK, CHART_GRID, getChartColor } from './chartColors';

interface LineConfig {
  key: string;
  color?: string;
  name?: string;
  strokeDasharray?: string;
}

interface AnalyticsLineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: LineConfig[];
  height?: number;
  onClick?: (data: Record<string, unknown>) => void;
}

export function AnalyticsLineChart({
  data,
  xKey,
  lines,
  height = 300,
  onClick,
}: AnalyticsLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        onClick={onClick ? (e: Record<string, unknown>) => {
          const payload = e?.activePayload as { payload: Record<string, unknown> }[] | undefined;
          if (payload?.[0]) onClick(payload[0].payload);
        } : undefined}
        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#666' }}
          tickLine={false}
          axisLine={{ stroke: CHART_GRID }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#666' }}
          tickLine={false}
          axisLine={{ stroke: CHART_GRID }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontSize: 12,
            color: '#000',
          }}
        />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines.map((line, i) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color || getChartColor(i)}
            name={line.name || line.key}
            strokeWidth={2}
            strokeDasharray={line.strokeDasharray}
            dot={{ r: 3, fill: line.color || getChartColor(i) }}
            activeDot={{ r: 5 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
