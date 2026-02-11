import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function ProgramNotFound() {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileQuestion className="mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-2 text-lg font-semibold text-black">Program not found</h2>
        <p className="mb-4 text-sm text-gray-500">
          The program you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/programs">
          <Button variant="secondary">Go back to Programs</Button>
        </Link>
      </div>
    </Card>
  );
}
