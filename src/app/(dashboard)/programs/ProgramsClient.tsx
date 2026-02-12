'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgramForm } from './ProgramForm';
import { exportToCsv } from '@/lib/utils/csvExport';
import { Plus, ClipboardList, Download, Users, Calendar, AlertTriangle } from 'lucide-react';
import type { TrainingProgram, ColumnDef } from '@/types';

interface EnrichedProgram extends TrainingProgram {
  athleteCount: number;
  injuryCount: number;
}

function computeProgress(program: EnrichedProgram): { pct: number; label: string; status: 'not-started' | 'active' | 'complete' } | null {
  if (!program.startDate || !program.durationWeeks) return null;
  const start = new Date(program.startDate).getTime();
  const totalMs = program.durationWeeks * 7 * 86400000;
  const end = start + totalMs;
  const now = Date.now();
  if (now < start) return { pct: 0, label: 'Not started', status: 'not-started' };
  if (now >= end) return { pct: 100, label: 'Complete', status: 'complete' };
  const pct = Math.round(((now - start) / totalMs) * 100);
  const currentWeek = Math.ceil((now - start) / (7 * 86400000));
  return { pct, label: `Week ${currentWeek}/${program.durationWeeks}`, status: 'active' };
}

const programColumns: ColumnDef<EnrichedProgram>[] = [
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
    key: 'athleteCount' as keyof EnrichedProgram,
    header: 'Athletes',
    sortable: true,
    render: (value) => (
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-gray-400" />
        <span className="font-medium">{value as number}</span>
      </div>
    ),
  },
  {
    key: 'durationWeeks',
    header: 'Duration',
    sortable: true,
    render: (value) => (
      <span className="text-gray-600">
        {value ? `${value} weeks` : '—'}
      </span>
    ),
  },
  {
    key: 'startDate',
    header: 'Progress',
    render: (_value, program) => {
      const prog = computeProgress(program);
      if (!prog) return <span className="text-gray-400">—</span>;
      return (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 rounded-full bg-gray-100">
            <div
              className={`h-1.5 rounded-full ${
                prog.status === 'complete' ? 'bg-success' : prog.status === 'active' ? 'bg-black' : 'bg-gray-300'
              }`}
              style={{ width: `${prog.pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{prog.label}</span>
        </div>
      );
    },
  },
  {
    key: 'injuryCount' as keyof EnrichedProgram,
    header: 'Injuries',
    sortable: true,
    render: (value) => {
      const count = value as number;
      return count > 0 ? (
        <Badge variant="warning">{count}</Badge>
      ) : (
        <span className="text-gray-400">0</span>
      );
    },
  },
];

interface ProgramsClientProps {
  programs: EnrichedProgram[];
  totalEnrolled: number;
  totalAthletes: number;
}

export function ProgramsClient({ programs, totalEnrolled, totalAthletes }: ProgramsClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activePrograms = useMemo(() => {
    return programs.filter((p) => {
      const prog = computeProgress(p);
      return prog && prog.status === 'active';
    }).length;
  }, [programs]);

  const avgDuration = useMemo(() => {
    const withDuration = programs.filter((p) => p.durationWeeks);
    if (withDuration.length === 0) return 0;
    return Math.round(withDuration.reduce((sum, p) => sum + (p.durationWeeks || 0), 0) / withDuration.length);
  }, [programs]);

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
                  const headers = ['Name', 'Description', 'Start Date', 'Duration (weeks)', 'Athletes', 'Active Injuries'];
                  const rows = programs.map((p) => [p.name, p.description, p.startDate ?? '', p.durationWeeks ?? '', p.athleteCount, p.injuryCount]);
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

      {programs.length > 0 && (
        <>
          {/* Summary stat cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <ClipboardList className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{programs.length}</p>
                  <p className="text-xs text-gray-500">Total Programs</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Calendar className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{activePrograms}</p>
                  <p className="text-xs text-gray-500">Active Programs</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">
                    {totalEnrolled}
                    <span className="ml-1 text-sm font-normal text-gray-400">/ {totalAthletes}</span>
                  </p>
                  <p className="text-xs text-gray-500">Athletes Enrolled</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{avgDuration}</p>
                  <p className="text-xs text-gray-500">Avg Duration (wks)</p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

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
