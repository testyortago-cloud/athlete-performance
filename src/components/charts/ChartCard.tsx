'use client';

import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { HelpTip } from '@/components/ui/HelpTip';
import { cn } from '@/utils/cn';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  helpTip?: { term: string; description: string };
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function ChartCard({ title, subtitle, helpTip, actions, children, loading, className }: ChartCardProps) {
  if (loading) {
    return <SkeletonCard className={className} />;
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-black">{title}</h3>
            {helpTip && <HelpTip term={helpTip.term} description={helpTip.description} />}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}
