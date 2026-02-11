import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function LoadEntryNotFound() {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileQuestion className="mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-2 text-lg font-semibold text-black">Load entry not found</h2>
        <p className="mb-4 text-sm text-gray-500">
          The load monitoring entry you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/load-monitoring">
          <Button variant="secondary">Go back to Load Monitoring</Button>
        </Link>
      </div>
    </Card>
  );
}
