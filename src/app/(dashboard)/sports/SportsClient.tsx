'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { SportForm } from './SportForm';
import { Plus, Trophy } from 'lucide-react';
import type { Sport, ColumnDef } from '@/types';

const sportColumns: ColumnDef<Sport>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    filterable: true,
    filterType: 'text',
    render: (_value, sport) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Trophy className="h-4 w-4 text-gray-500" />
        </div>
        <span className="font-medium">{sport.name}</span>
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

      {sports.length === 0 ? (
        <EmptyState
          icon="sports"
          title="No sports yet"
          description="Create your first sport to define metric categories and testing protocols."
          actionLabel="Add Sport"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <InteractiveTable
          columns={sportColumns}
          data={sports}
          onRowClick={(sport) => router.push(`/sports/${sport.id}`)}
          searchPlaceholder="Search sports..."
        />
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Sport">
        <SportForm onSuccess={() => setShowCreateModal(false)} />
      </Modal>
    </>
  );
}
