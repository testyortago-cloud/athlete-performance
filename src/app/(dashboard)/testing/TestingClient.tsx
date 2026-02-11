'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { testingColumns } from './TestingTableColumns';
import { Plus } from 'lucide-react';
import type { TestingSession } from '@/types';

interface TestingClientProps {
  sessions: TestingSession[];
}

export function TestingClient({ sessions }: TestingClientProps) {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Testing"
        actions={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => router.push('/testing/new')}
          >
            New Session
          </Button>
        }
      />

      <InteractiveTable
        columns={testingColumns}
        data={sessions}
        onRowClick={(session) => router.push(`/testing/${session.id}`)}
        searchPlaceholder="Search sessions..."
      />
    </>
  );
}
