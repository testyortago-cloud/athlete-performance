'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function RiskError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-danger" />
        <h2 className="mb-2 text-lg font-semibold text-black">Something went wrong</h2>
        <p className="mb-4 text-sm text-gray-500">
          {error.message || 'Failed to load risk analysis data.'}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </Card>
  );
}
