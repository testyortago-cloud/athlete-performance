'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_GRID, getChartColor } from './chartColors';

interface AreaConfig {
  key: string;
  color?: string;
  name?: string;
}

interface AnalyticsAreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: AreaConfig[];
  height?: number;
}

export function AnalyticsAreaChart({
  data,
  xKey,
  areas,
  height = 300,
}: AnalyticsAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
      >
        <defs>
          {areas.map((area, i) => {
            const color = area.color || getChartColor(i);
            return (
              <linearGradient key={area.key} id={`gradient-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
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
        {areas.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {areas.map((area, i) => {
          const color = area.color || getChartColor(i);
          return (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${area.key})`}
              name={area.name || area.key}
            />
          );
        })}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
