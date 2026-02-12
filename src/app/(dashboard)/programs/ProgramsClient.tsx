'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgramForm } from './ProgramForm';
import { exportToCsv } from '@/lib/utils/csvExport';
import { Plus, ClipboardList, Download } from 'lucide-react';
import type { TrainingProgram, ColumnDef } from '@/types';

const programColumns: ColumnDef<TrainingProgram>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    render: (_value, program) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <ClipboardList className="h-4 w-4 text-gray-500" />
        </div>
        <span className="font-medium">{program.name}</span>
      </div>
    ),
  },
  {
    key: 'description',
    header: 'Description',
    render: (value) => (
      <span className="text-gray-500 truncate max-w-xs block">
        {(value as string) || '—'}
      </span>
    ),
  },
];

export function ProgramsClient({ programs }: { programs: TrainingProgram[] }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Programs"
        actions={
          <div className="flex items-center gap-2">
            {programs.length > 0 && (
              <Button
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                onClick={() => {
                  const headers = ['Name', 'Description', 'Start Date', 'Duration (weeks)'];
                  const rows = programs.map((p) => [p.name, p.description, p.startDate ?? '', p.durationWeeks ?? '']);
                  exportToCsv('programs.csv', headers, rows);
                }}
              >
                Export
              </Button>
            )}
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
              Add Program
            </Button>
          </div>
        }
      />

      {programs.length === 0 ? (
        <EmptyState
          icon="programs"
          title="No programs yet"
          description="Create a training program to organize and track athlete development."
          actionLabel="Add Program"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <InteractiveTable
          columns={programColumns}
          data={programs}
          onRowClick={(program) => router.push(`/programs/${program.id}`)}
          searchPlaceholder="Search programs..."
        />
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Program">
        <ProgramForm onSuccess={() => setShowCreateModal(false)} />
      </Modal>
    </>
  );
}
