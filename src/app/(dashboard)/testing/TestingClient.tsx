'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { testingColumns } from './TestingTableColumns';
import { exportToCsv } from '@/lib/utils/csvExport';
import { Plus, Download } from 'lucide-react';
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
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <Button
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                onClick={() => {
                  const headers = ['Date', 'Athlete', 'Notes', 'Created By'];
                  const rows = sessions.map((s) => [s.date, s.athleteName ?? '', s.notes, s.createdBy]);
                  exportToCsv('testing_sessions.csv', headers, rows);
                }}
              >
                Export
              </Button>
            )}
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => router.push('/testing/new')}
            >
              New Session
            </Button>
          </div>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon="testing"
          title="No testing sessions yet"
          description="Create a testing session to record athlete performance trials and track improvements."
          actionLabel="New Session"
          onAction={() => router.push('/testing/new')}
        />
      ) : (
        <InteractiveTable
          columns={testingColumns}
          data={sessions}
          onRowClick={(session) => router.push(`/testing/${session.id}`)}
          searchPlaceholder="Search sessions..."
        />
      )}
    </>
  );
}
