'use client';

import { cn } from '@/utils/cn';

interface AcwrGaugeProps {
  value: number;
  moderateThreshold?: number;
  highThreshold?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function AcwrGauge({
  value,
  moderateThreshold = 1.3,
  highThreshold = 1.5,
  size = 'md',
  className,
}: AcwrGaugeProps) {
  const maxValue = 2.5;
  const minValue = 0;
  const range = maxValue - minValue;

  // Angle calculations: gauge spans from -135 to 135 degrees (270 degree arc)
  const startAngle = -135;
  const endAngle = 135;
  const angleRange = endAngle - startAngle;

  const clampedValue = Math.max(minValue, Math.min(value, maxValue));
  const valueAngle = startAngle + ((clampedValue - minValue) / range) * angleRange;

  // SVG params
  const svgSize = size === 'sm' ? 120 : 160;
  const cx = svgSize / 2;
  const cy = svgSize / 2 + 8;
  const radius = size === 'sm' ? 42 : 58;
  const strokeWidth = size === 'sm' ? 8 : 10;

  function polarToCartesian(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function arcPath(start: number, end: number, r: number) {
    const s = polarToCartesian(start - 90, r);
    const e = polarToCartesian(end - 90, r);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  // Zone boundaries as angles
  const moderateAngle = startAngle + ((moderateThreshold - minValue) / range) * angleRange;
  const highAngle = startAngle + ((highThreshold - minValue) / range) * angleRange;

  // Needle endpoint
  const needleTip = polarToCartesian(valueAngle - 90, radius - 2);
  const needleBase1 = polarToCartesian(valueAngle - 90 + 90, 4);
  const needleBase2 = polarToCartesian(valueAngle - 90 - 90, 4);

  // Risk label
  let riskLabel: string;
  let riskColor: string;
  if (value >= highThreshold) {
    riskLabel = 'High';
    riskColor = 'text-danger';
  } else if (value >= moderateThreshold) {
    riskLabel = 'Moderate';
    riskColor = 'text-warning';
  } else {
    riskLabel = 'Low';
    riskColor = 'text-success';
  }

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <svg width={svgSize} height={svgSize * 0.7} viewBox={`0 0 ${svgSize} ${svgSize * 0.7}`}>
        {/* Background track */}
        <path
          d={arcPath(startAngle, endAngle, radius)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Green zone: 0 to moderate */}
        <path
          d={arcPath(startAngle, moderateAngle, radius)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.3}
        />

        {/* Yellow zone: moderate to high */}
        <path
          d={arcPath(moderateAngle, highAngle, radius)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />

        {/* Red zone: high to max */}
        <path
          d={arcPath(highAngle, endAngle, radius)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.3}
        />

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill="#000"
        />
        <circle cx={cx} cy={cy} r={5} fill="#000" />

        {/* Value text */}
        <text
          x={cx}
          y={cy + (size === 'sm' ? 20 : 26)}
          textAnchor="middle"
          className="text-lg font-bold"
          fill="#000"
          fontSize={size === 'sm' ? 14 : 18}
        >
          {value.toFixed(2)}
        </text>
      </svg>
      <span className={cn('text-xs font-semibold -mt-1', riskColor)}>
        {riskLabel} Risk
      </span>
    </div>
  );
}
