'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { DailyLoadForm } from '../DailyLoadForm';
import { deleteDailyLoadAction } from '../actions';
import { AcwrGauge } from '@/components/charts/AcwrGauge';
import { useToastStore } from '@/stores/toastStore';
import { Pencil, Trash2 } from 'lucide-react';
import type { DailyLoad, Athlete } from '@/types';

interface LoadDetailClientProps {
  load: DailyLoad;
  athletes: Athlete[];
  acwr?: number | null;
}

function getRpeBadgeVariant(rpe: number): 'success' | 'warning' | 'danger' {
  if (rpe <= 3) return 'success';
  if (rpe <= 6) return 'warning';
  return 'danger';
}

export function LoadDetailClient({ load, athletes, acwr }: LoadDetailClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteDailyLoadAction(load.id);
    if (result.success) {
      addToast('Load entry deleted successfully', 'success');
      router.push('/load-monitoring');
      router.refresh();
    }
    setDeleting(false);
  }

  const formattedDate = load.date
    ? new Date(load.date).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <>
      <PageHeader
        title={`${load.athleteName} - ${formattedDate}`}
        breadcrumbs={[
          { label: 'Load Monitoring', href: '/load-monitoring' },
          { label: `${load.athleteName} - ${formattedDate}` },
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ACWR Gauge */}
        {acwr != null && (
          <Card className="flex flex-col items-center justify-center">
            <h3 className="mb-2 text-sm font-semibold text-black">Athlete ACWR</h3>
            <AcwrGauge value={acwr} size="md" />
          </Card>
        )}

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">Load Details</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Athlete</dt>
              <dd className="text-sm font-medium text-black">{load.athleteName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Date</dt>
              <dd className="text-sm font-medium text-black">{formattedDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Session Type</dt>
              <dd className="text-sm font-medium text-black">{load.sessionType}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">Training Load</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">RPE</dt>
              <dd>
                <Badge variant={getRpeBadgeVariant(load.rpe)}>
                  {load.rpe}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Duration</dt>
              <dd className="text-sm font-medium text-black">{load.durationMinutes} min</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Training Load</dt>
              <dd className="text-sm font-semibold text-black">{load.trainingLoad}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Load Entry">
        <DailyLoadForm
          load={load}
          athletes={athletes}
          onSuccess={() => setShowEditModal(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Load Entry"
        message={`Are you sure you want to delete this load entry for ${load.athleteName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
