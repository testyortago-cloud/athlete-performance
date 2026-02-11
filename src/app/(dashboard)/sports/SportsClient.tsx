'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { SportForm } from './SportForm';
import { Plus } from 'lucide-react';
import type { Sport, ColumnDef } from '@/types';

const sportColumns: ColumnDef<Sport>[] = [
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

export function SportsClient({ sports }: { sports: Sport[] }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <PageHeader
        title="Sports"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
            Add Sport
          </Button>
        }
      />

      <InteractiveTable
        columns={sportColumns}
        data={sports}
        onRowClick={(sport) => router.push(`/sports/${sport.id}`)}
        searchPlaceholder="Search sports..."
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Sport">
        <SportForm onSuccess={() => setShowCreateModal(false)} />
      </Modal>
    </>
  );
}
