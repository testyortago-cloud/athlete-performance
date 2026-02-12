'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { ProgramForm } from '../ProgramForm';
import { deleteProgramAction, duplicateProgramAction } from '../actions';
import { useToastStore } from '@/stores/toastStore';
import { Pencil, Trash2, Copy, Calendar, Clock } from 'lucide-react';
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
  const { addToast } = useToastStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const progress = useMemo(() => {
    if (!program.startDate || !program.durationWeeks) return null;
    const start = new Date(program.startDate).getTime();
    const totalMs = program.durationWeeks * 7 * 86400000;
    const end = start + totalMs;
    const now = Date.now();
    const elapsed = now - start;
    const pct = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));
    const currentWeek = Math.min(program.durationWeeks, Math.max(1, Math.ceil(elapsed / (7 * 86400000))));
    const isComplete = now >= end;
    const isNotStarted = now < start;
    return { pct, currentWeek, isComplete, isNotStarted, start, end };
  }, [program.startDate, program.durationWeeks]);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteProgramAction(program.id);
    if (result.success) {
      addToast('Program deleted successfully', 'success');
      router.push('/programs');
      router.refresh();
    }
    setDeleting(false);
  }

  async function handleDuplicate() {
    setDuplicating(true);
    const result = await duplicateProgramAction(program.id);
    if (result.success) {
      addToast('Program duplicated successfully', 'success');
      router.push('/programs');
      router.refresh();
    } else {
      addToast(result.error || 'Failed to duplicate', 'error');
    }
    setDuplicating(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
              icon={<Copy className="h-4 w-4" />}
              onClick={handleDuplicate}
              loading={duplicating}
            >
              Duplicate
            </Button>
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

      {/* Program info + progress */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-black">Program Details</h3>
          <dl className="space-y-3">
            {program.description && (
              <div>
                <dt className="text-xs text-gray-500">Description</dt>
                <dd className="mt-0.5 text-sm text-black">{program.description}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5 text-sm text-gray-500">
                <Calendar className="h-3.5 w-3.5" /> Start Date
              </dt>
              <dd className="text-sm font-medium text-black">
                {program.startDate ? formatDate(program.startDate) : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock className="h-3.5 w-3.5" /> Duration
              </dt>
              <dd className="text-sm font-medium text-black">
                {program.durationWeeks ? `${program.durationWeeks} weeks` : '—'}
              </dd>
            </div>
            {program.startDate && program.durationWeeks && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">End Date</dt>
                <dd className="text-sm font-medium text-black">
                  {formatDate(
                    new Date(
                      new Date(program.startDate).getTime() + program.durationWeeks * 7 * 86400000
                    ).toISOString()
                  )}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {progress && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-black">Program Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {progress.isNotStarted
                    ? 'Not started yet'
                    : progress.isComplete
                      ? 'Program complete'
                      : `Week ${progress.currentWeek} of ${program.durationWeeks}`}
                </span>
                <span className="font-medium text-black">{Math.round(progress.pct)}%</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100">
                <div
                  className={`h-3 rounded-full transition-all ${
                    progress.isComplete ? 'bg-success' : 'bg-black'
                  }`}
                  style={{ width: `${progress.pct}%` }}
                />
              </div>

              {/* Gantt-style timeline */}
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Timeline
                </h4>
                <div className="relative">
                  {/* Track */}
                  <div className="h-8 rounded-md bg-gray-100 relative overflow-hidden">
                    {/* Elapsed portion */}
                    <div
                      className={`absolute inset-y-0 left-0 rounded-l-md ${
                        progress.isComplete ? 'bg-success/20' : 'bg-black/10'
                      }`}
                      style={{ width: `${progress.pct}%` }}
                    />
                    {/* Today marker */}
                    {!progress.isNotStarted && !progress.isComplete && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-black"
                        style={{ left: `${progress.pct}%` }}
                      >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Today
                        </div>
                      </div>
                    )}
                    {/* Week markers */}
                    {program.durationWeeks! <= 24 &&
                      Array.from({ length: program.durationWeeks! - 1 }, (_, i) => {
                        const pos = ((i + 1) / program.durationWeeks!) * 100;
                        return (
                          <div
                            key={i}
                            className="absolute top-0 bottom-0 w-px bg-gray-300/50"
                            style={{ left: `${pos}%` }}
                          />
                        );
                      })}
                  </div>
                  {/* Labels */}
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    <span>{formatDate(program.startDate!)}</span>
                    <span>
                      {formatDate(
                        new Date(
                          new Date(program.startDate!).getTime() +
                            program.durationWeeks! * 7 * 86400000
                        ).toISOString()
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

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
