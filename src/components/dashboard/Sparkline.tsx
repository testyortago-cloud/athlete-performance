'use client';

import { cn } from '@/utils/cn';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  className?: string;
}

export function Sparkline({ data, color = '#000000', height = 32, width = 80, className }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const innerHeight = height - padding * 2;
  const innerWidth = width - padding * 2;
  const step = innerWidth / (data.length - 1);

  const points = data.map((value, i) => {
    const x = padding + i * step;
    const y = padding + innerHeight - ((value - min) / range) * innerHeight;
    return `${x},${y}`;
  }).join(' ');

  // Create fill area path
  const firstX = padding;
  const lastX = padding + (data.length - 1) * step;
  const fillPath = `M${firstX},${height} L${points.split(' ').map(p => p).join(' L')} L${lastX},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path
        d={fillPath}
        fill={color}
        opacity={0.08}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
