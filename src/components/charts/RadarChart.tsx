'use client';

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { getChartColor } from './chartColors';

interface RadarDataPoint {
  metric: string;
  [key: string]: string | number;
}

interface AnalyticsRadarChartProps {
  data: RadarDataPoint[];
  athletes: { key: string; name: string; color?: string }[];
  height?: number;
}

export function AnalyticsRadarChart({ data, athletes, height = 350 }: AnalyticsRadarChartProps) {
  if (data.length === 0 || athletes.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#e0e0e0" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: '#666' }}
        />
        <PolarRadiusAxis
          tick={{ fontSize: 10, fill: '#999' }}
          axisLine={false}
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
        {athletes.map((athlete, i) => (
          <Radar
            key={athlete.key}
            name={athlete.name}
            dataKey={athlete.key}
            stroke={athlete.color || getChartColor(i)}
            fill={athlete.color || getChartColor(i)}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        {athletes.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
