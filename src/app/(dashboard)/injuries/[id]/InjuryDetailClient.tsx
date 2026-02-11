'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { InjuryForm } from '../InjuryForm';
import { deleteInjuryAction } from '../actions';
import { Pencil, Trash2 } from 'lucide-react';
import type { Injury, Athlete } from '@/types';

interface InjuryDetailClientProps {
  injury: Injury;
  athletes: Athlete[];
}

export function InjuryDetailClient({ injury, athletes }: InjuryDetailClientProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteInjuryAction(injury.id);
    if (result.success) {
      router.push('/injuries');
      router.refresh();
    }
    setDeleting(false);
  }

  const dateOccurred = injury.dateOccurred
    ? new Date(injury.dateOccurred).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const dateResolved = injury.dateResolved
    ? new Date(injury.dateResolved).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <>
      <PageHeader
        title={`${injury.athleteName} - ${injury.bodyRegion}`}
        breadcrumbs={[
          { label: 'Injuries', href: '/injuries' },
          { label: `${injury.athleteName} - ${injury.bodyRegion}` },
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">Injury Details</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Athlete</dt>
              <dd className="text-sm font-medium text-black">{injury.athleteName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Type</dt>
              <dd>
                <Badge variant={injury.type === 'injury' ? 'warning' : 'danger'}>
                  {injury.type === 'injury' ? 'Injury' : 'Illness'}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Body Region</dt>
              <dd className="text-sm font-medium text-black">{injury.bodyRegion}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Description</dt>
              <dd className="text-sm font-medium text-black">{injury.description}</dd>
            </div>
            {injury.mechanism && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Mechanism</dt>
                <dd className="text-sm font-medium text-black">{injury.mechanism}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">Timeline</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Date Occurred</dt>
              <dd className="text-sm font-medium text-black">{dateOccurred}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Date Resolved</dt>
              <dd className="text-sm font-medium text-black">{dateResolved}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Days Lost</dt>
              <dd className="text-sm font-medium text-black">
                {injury.status === 'active' ? 'Ongoing' : (injury.daysLost != null ? injury.daysLost : '—')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <Badge variant={injury.status === 'active' ? 'danger' : 'success'}>
                  {injury.status === 'active' ? 'Active' : 'Resolved'}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Injury" size="lg">
        <InjuryForm
          injury={injury}
          athletes={athletes}
          onSuccess={() => setShowEditModal(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Injury"
        message={`Are you sure you want to delete this injury record for ${injury.athleteName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
