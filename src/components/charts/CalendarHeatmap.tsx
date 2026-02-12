'use client';

import { useMemo } from 'react';
import { cn } from '@/utils/cn';

interface DayData {
  date: string; // YYYY-MM-DD
  value: number;
}

interface CalendarHeatmapProps {
  data: DayData[];
  className?: string;
}

function getIntensityColor(value: number, max: number): string {
  if (value === 0 || max === 0) return 'bg-gray-100';
  const ratio = value / max;
  if (ratio < 0.25) return 'bg-success/20';
  if (ratio < 0.5) return 'bg-success/40';
  if (ratio < 0.75) return 'bg-warning/50';
  return 'bg-danger/50';
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function CalendarHeatmap({ data, className }: CalendarHeatmapProps) {
  const { weeks, months, maxVal } = useMemo(() => {
    // Build a map of date → value
    const dateMap = new Map(data.map((d) => [d.date, d.value]));
    const maxVal = Math.max(...data.map((d) => d.value), 1);

    // Generate weeks for the last 3 months (13 weeks)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 12 * 7); // 12 weeks back
    // Align to Monday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - ((dayOfWeek + 6) % 7));

    const weeks: { date: string; value: number; dayOfMonth: number }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let currentMonth = -1;

    const cursor = new Date(startDate);
    while (cursor <= today || weeks.length < 13) {
      const week: { date: string; value: number; dayOfMonth: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cursor.toISOString().split('T')[0];
        const isFuture = cursor > today;
        week.push({
          date: dateStr,
          value: isFuture ? -1 : (dateMap.get(dateStr) || 0),
          dayOfMonth: cursor.getDate(),
        });

        // Track month labels
        if (cursor.getMonth() !== currentMonth && !isFuture) {
          currentMonth = cursor.getMonth();
          months.push({
            label: cursor.toLocaleDateString('en-AU', { month: 'short' }),
            weekIndex: weeks.length,
          });
        }

        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
      if (weeks.length >= 13) break;
    }

    return { weeks, months, maxVal };
  }, [data]);

  return (
    <div className={cn('', className)}>
      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {months.map((m, i) => (
          <span
            key={i}
            className="text-[10px] text-gray-400"
            style={{ marginLeft: i === 0 ? `${m.weekIndex * 16}px` : undefined, width: '48px' }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-3 w-6 text-[9px] text-gray-400 flex items-center">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                className={cn(
                  'h-3 w-3 rounded-[2px]',
                  day.value === -1 ? 'bg-transparent' : getIntensityColor(day.value, maxVal)
                )}
                title={day.value >= 0 ? `${day.date}: ${day.value}` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-1 ml-8 text-[10px] text-gray-400">
        <span>Less</span>
        <div className="h-3 w-3 rounded-[2px] bg-gray-100" />
        <div className="h-3 w-3 rounded-[2px] bg-success/20" />
        <div className="h-3 w-3 rounded-[2px] bg-success/40" />
        <div className="h-3 w-3 rounded-[2px] bg-warning/50" />
        <div className="h-3 w-3 rounded-[2px] bg-danger/50" />
        <span>More</span>
      </div>
    </div>
  );
}
