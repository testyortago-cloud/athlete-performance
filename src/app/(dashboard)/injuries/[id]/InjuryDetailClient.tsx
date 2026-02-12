'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { BodyMap } from '@/components/charts/BodyMap';
import { InjuryForm } from '../InjuryForm';
import { deleteInjuryAction } from '../actions';
import { useToastStore } from '@/stores/toastStore';
import { cn } from '@/utils/cn';
import {
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
} from 'lucide-react';
import type { Injury, Athlete } from '@/types';

interface InjuryDetailClientProps {
  injury: Injury;
  athletes: Athlete[];
  athleteInjuries: Injury[];
}

const STATUS_STEPS = ['active', 'rehab', 'monitoring', 'resolved'] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; badgeVariant: 'danger' | 'warning' | 'default' | 'success' }> = {
  active: { label: 'Active', color: 'bg-danger', badgeVariant: 'danger' },
  rehab: { label: 'Rehab', color: 'bg-warning', badgeVariant: 'warning' },
  monitoring: { label: 'Monitoring', color: 'bg-gray-400', badgeVariant: 'default' },
  resolved: { label: 'Resolved', color: 'bg-success', badgeVariant: 'success' },
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function InjuryDetailClient({ injury, athletes, athleteInjuries }: InjuryDetailClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteInjuryAction(injury.id);
    if (result.success) {
      addToast('Injury deleted successfully', 'success');
      router.push('/injuries');
      router.refresh();
    }
    setDeleting(false);
  }

  // Computed metrics
  const daysSinceInjury = useMemo(() => {
    const occurred = new Date(injury.dateOccurred).getTime();
    const now = Date.now();
    return Math.floor((now - occurred) / 86400000);
  }, [injury.dateOccurred]);

  const otherInjuries = useMemo(
    () => athleteInjuries.filter((i) => i.id !== injury.id),
    [athleteInjuries, injury.id],
  );

  const sameRegionCount = useMemo(
    () => athleteInjuries.filter(
      (i) => i.id !== injury.id && i.bodyRegion.toLowerCase() === injury.bodyRegion.toLowerCase(),
    ).length,
    [athleteInjuries, injury.id, injury.bodyRegion],
  );

  const totalDaysLost = useMemo(
    () => athleteInjuries.reduce((sum, i) => sum + (i.daysLost ?? 0), 0),
    [athleteInjuries],
  );

  const bodyMapData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of athleteInjuries) {
      const region = i.bodyRegion || 'Unknown';
      counts[region] = (counts[region] || 0) + 1;
    }
    return Object.entries(counts).map(([region, count]) => ({ region, count }));
  }, [athleteInjuries]);

  // Status stepper
  const currentStepIdx = STATUS_STEPS.indexOf(injury.status as typeof STATUS_STEPS[number]);

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

      {/* Quick stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10">
              <Clock className="h-4 w-4 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{daysSinceInjury}</p>
              <p className="text-[11px] text-gray-500">Days Since Injury</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Calendar className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">
                {injury.status !== 'resolved' ? 'Ongoing' : (injury.daysLost ?? '—')}
              </p>
              <p className="text-[11px] text-gray-500">Days Lost</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Activity className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{athleteInjuries.length}</p>
              <p className="text-[11px] text-gray-500">Total Injuries</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              sameRegionCount > 0 ? 'bg-danger/10' : 'bg-success/10',
            )}>
              <AlertTriangle className={cn(
                'h-4 w-4',
                sameRegionCount > 0 ? 'text-danger' : 'text-success',
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{sameRegionCount}</p>
              <p className="text-[11px] text-gray-500">Recurrences ({injury.bodyRegion})</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Status progression stepper */}
      <Card className="mb-6">
        <h3 className="mb-4 text-sm font-semibold text-black">Recovery Progress</h3>
        <div className="flex items-center">
          {STATUS_STEPS.map((step, idx) => {
            const config = STATUS_CONFIG[step];
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    isCurrent
                      ? `${config.color} border-transparent text-white`
                      : isCompleted
                        ? 'border-success bg-success/10 text-success'
                        : 'border-gray-200 bg-white text-gray-400',
                  )}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span className={cn(
                    'mt-1.5 text-[11px] font-medium',
                    isCurrent ? 'text-black' : isCompleted ? 'text-success' : 'text-gray-400',
                  )}>
                    {config.label}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={cn(
                    'h-0.5 w-full -mt-5',
                    idx < currentStepIdx ? 'bg-success' : 'bg-gray-200',
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main content — 3 columns: body map, details, timeline */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Body map */}
        <Card className="flex flex-col items-center">
          <h3 className="mb-3 w-full text-sm font-semibold text-black">
            {injury.athleteName}&apos;s Injury Map
          </h3>
          <BodyMap data={bodyMapData} compact />
          {bodyMapData.length > 0 && (
            <div className="mt-3 w-full space-y-1.5">
              {bodyMapData
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
                .map((d) => (
                  <div key={d.region} className="flex items-center justify-between text-xs">
                    <span className={cn(
                      'text-gray-600',
                      d.region.toLowerCase() === injury.bodyRegion.toLowerCase() && 'font-semibold text-black',
                    )}>
                      {d.region}
                      {d.region.toLowerCase() === injury.bodyRegion.toLowerCase() && (
                        <ArrowRight className="ml-1 inline h-3 w-3 text-danger" />
                      )}
                    </span>
                    <span className="text-gray-400">{d.count}</span>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Injury details */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-black">Injury Details</h3>
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
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <Badge variant={STATUS_CONFIG[injury.status]?.badgeVariant ?? 'default'}>
                  {STATUS_CONFIG[injury.status]?.label ?? injury.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 mb-1">Description</dt>
              <dd className="text-sm text-black">{injury.description}</dd>
            </div>
            {injury.mechanism && (
              <div>
                <dt className="text-sm text-gray-500 mb-1">Mechanism</dt>
                <dd className="text-sm text-black">{injury.mechanism}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Timeline */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-black">Timeline</h3>
          <div className="relative space-y-6 pl-6 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-8px)] before:w-0.5 before:bg-gray-200">
            {/* Occurred */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-danger bg-white">
                <div className="h-1.5 w-1.5 rounded-full bg-danger" />
              </div>
              <p className="text-sm font-medium text-black">Injury Occurred</p>
              <p className="text-xs text-gray-500">{formatDate(injury.dateOccurred)}</p>
            </div>

            {/* Current status (if not active or resolved) */}
            {(injury.status === 'rehab' || injury.status === 'monitoring') && (
              <div className="relative">
                <div className={cn(
                  'absolute -left-6 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 bg-white',
                  injury.status === 'rehab' ? 'border-warning' : 'border-gray-400',
                )}>
                  <div className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    injury.status === 'rehab' ? 'bg-warning' : 'bg-gray-400',
                  )} />
                </div>
                <p className="text-sm font-medium text-black">
                  {STATUS_CONFIG[injury.status].label}
                </p>
                <p className="text-xs text-gray-500">Current stage</p>
              </div>
            )}

            {/* Resolved */}
            <div className="relative">
              <div className={cn(
                'absolute -left-6 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 bg-white',
                injury.status === 'resolved' ? 'border-success' : 'border-gray-200',
              )}>
                {injury.status === 'resolved' ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-success" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-gray-200" />
                )}
              </div>
              <p className={cn(
                'text-sm font-medium',
                injury.status === 'resolved' ? 'text-black' : 'text-gray-400',
              )}>
                Resolved
              </p>
              <p className="text-xs text-gray-500">
                {injury.dateResolved ? formatDate(injury.dateResolved) : 'Pending'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium text-black">
                {injury.status === 'resolved' && injury.daysLost != null
                  ? `${injury.daysLost} days`
                  : `${daysSinceInjury} days (ongoing)`}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-gray-500">Athlete total days lost</span>
              <span className="font-medium text-black">{totalDaysLost} days</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Athlete injury history */}
      {otherInjuries.length > 0 && (
        <Card padding="none">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-black">
              {injury.athleteName}&apos;s Injury History
              <span className="ml-2 text-xs font-normal text-gray-400">
                {otherInjuries.length} other {otherInjuries.length === 1 ? 'record' : 'records'}
              </span>
            </h3>
          </div>
          <div className="divide-y divide-border">
            {otherInjuries.map((other) => (
              <Link
                key={other.id}
                href={`/injuries/${other.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_CONFIG[other.status]?.badgeVariant ?? 'default'}>
                    {STATUS_CONFIG[other.status]?.label ?? other.status}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-black">{other.bodyRegion}</p>
                    <p className="text-xs text-gray-500">{other.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{formatShortDate(other.dateOccurred)}</span>
                  <span>
                    {other.status === 'resolved'
                      ? `${other.daysLost ?? 0}d lost`
                      : 'Ongoing'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

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
