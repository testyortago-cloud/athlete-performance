'use client';

import { useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/utils/cn';

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleCard({
  title,
  subtitle,
  icon,
  badge,
  defaultOpen = true,
  headerActions,
  children,
  className,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <Card padding="none" className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-3 px-6 py-4 text-left"
      >
        {icon && (
          <span className="shrink-0 text-gray-400">{icon}</span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-black">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        {badge && (
          <span className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {badge}
          </span>
        )}
        {headerActions && (
          <span className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {headerActions}
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <div
        id={contentId}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6">
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}
