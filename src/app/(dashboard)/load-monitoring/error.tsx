'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertTriangle } from 'lucide-react';

export default function LoadMonitoringError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <Card className="max-w-md text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-warning" />
        <h2 className="mb-2 text-lg font-semibold text-black">Something went wrong</h2>
        <p className="mb-6 text-sm text-gray-500">
          {error.message || 'Failed to load monitoring data. Please try again.'}
        </p>
        <Button onClick={reset}>Try Again</Button>
      </Card>
    </div>
  );
}
