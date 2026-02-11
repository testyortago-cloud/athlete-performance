'use client';

import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { AlertTriangle } from 'lucide-react';
import type { RiskAlert } from '@/types';

interface AlertsPanelProps {
  alerts: RiskAlert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertTriangle className="h-4 w-4" />
          <span>No active risk alerts</span>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="p-4 pb-2">
        <h3 className="text-sm font-semibold text-black">Risk Alerts</h3>
      </div>
      <div className="divide-y divide-border">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-3 px-4 py-3 border-l-3',
              alert.severity === 'danger'
                ? 'border-l-danger bg-danger/5'
                : 'border-l-warning bg-warning/5'
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black">{alert.athleteName}</p>
              <p className="text-xs text-gray-600">{alert.message}</p>
            </div>
            <span className="shrink-0 text-xs text-gray-400">{alert.date}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
