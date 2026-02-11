'use client';

import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { Users, AlertTriangle, Activity, ClipboardList, TrendingUp, TrendingDown } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  users: <Users className="h-5 w-5" />,
  'alert-triangle': <AlertTriangle className="h-5 w-5" />,
  activity: <Activity className="h-5 w-5" />,
  clipboard: <ClipboardList className="h-5 w-5" />,
};

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label: string;
  };
  icon?: string;
  onClick?: () => void;
  className?: string;
}

export function KpiCard({ label, value, trend, icon, onClick, className }: KpiCardProps) {
  return (
    <Card
      className={cn(
        'transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      padding="md"
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="flex w-full flex-col items-start text-left"
      >
        {icon && iconMap[icon] && (
          <div className="mb-2 text-gray-400">{iconMap[icon]}</div>
        )}
        <p className="text-3xl font-bold text-black">{value}</p>
        <p className="mt-1 text-sm text-gray-500">{label}</p>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-danger" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trend.direction === 'up' ? 'text-success' : 'text-danger'
              )}
            >
              {trend.value}%
            </span>
            <span className="text-xs text-gray-400">{trend.label}</span>
          </div>
        )}
      </button>
    </Card>
  );
}
