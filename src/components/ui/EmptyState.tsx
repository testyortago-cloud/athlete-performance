'use client';

import { cn } from '@/utils/cn';
import {
  Users,
  Trophy,
  ClipboardList,
  AlertTriangle,
  Activity,
  FlaskConical,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { Button } from './Button';

type EmptyStateIcon = 'athletes' | 'sports' | 'programs' | 'injuries' | 'load' | 'testing' | 'analytics';

const iconMap: Record<EmptyStateIcon, LucideIcon> = {
  athletes: Users,
  sports: Trophy,
  programs: ClipboardList,
  injuries: AlertTriangle,
  load: Activity,
  testing: FlaskConical,
  analytics: BarChart3,
};

interface EmptyStateProps {
  icon: EmptyStateIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-border bg-white px-6 py-16 text-center shadow-sm', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-gray-500" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-black">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
