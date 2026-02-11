'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { ProgramForm } from './ProgramForm';
import { Plus } from 'lucide-react';
import type { TrainingProgram, ColumnDef } from '@/types';

const programColumns: ColumnDef<TrainingProgram>[] = [
  { key: 'name', header: 'Name', sortable: true, filterable: true, filterType: 'text' },
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
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Add Program
          </Button>
        }
      />

      <InteractiveTable
        columns={programColumns}
        data={programs}
        onRowClick={(program) => router.push(`/programs/${program.id}`)}
        searchPlaceholder="Search programs..."
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Program">
        <ProgramForm onSuccess={() => setShowCreateModal(false)} />
      </Modal>
    </>
  );
}
