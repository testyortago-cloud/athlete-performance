'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { ProgramForm } from '../ProgramForm';
import { deleteProgramAction } from '../actions';
import { Pencil, Trash2 } from 'lucide-react';
import type { TrainingProgram, Athlete, ColumnDef } from '@/types';

const athleteColumns: ColumnDef<Athlete>[] = [
  { key: 'name', header: 'Name', sortable: true, filterable: true, filterType: 'text' },
  { key: 'sportName', header: 'Sport', sortable: true },
  { key: 'position', header: 'Position', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (value) => (
      <Badge variant={value === 'active' ? 'success' : 'default'}>
        {(value as string) === 'active' ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
];

interface ProgramDetailClientProps {
  program: TrainingProgram;
  athletes: Athlete[];
}

export function ProgramDetailClient({ program, athletes }: ProgramDetailClientProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteProgramAction(program.id);
    if (result.success) {
      router.push('/programs');
      router.refresh();
    }
    setDeleting(false);
  }

  return (
    <>
      <PageHeader
        title={program.name}
        breadcrumbs={[
          { label: 'Programs', href: '/programs' },
          { label: program.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      {program.description && (
        <Card className="mb-6">
          <p className="text-sm text-gray-700">{program.description}</p>
        </Card>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-black">
          Athletes in Program ({athletes.length})
        </h2>
      </div>

      {athletes.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-gray-500 py-8">
            No athletes assigned to this program yet.
          </p>
        </Card>
      ) : (
        <InteractiveTable
          columns={athleteColumns}
          data={athletes}
          onRowClick={(athlete) => router.push(`/athletes/${athlete.id}`)}
          searchPlaceholder="Search athletes..."
        />
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Program">
        <ProgramForm program={program} onSuccess={() => setShowEditModal(false)} />
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Program"
        message={`Are you sure you want to delete ${program.name}? Athletes in this program will be unassigned.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
