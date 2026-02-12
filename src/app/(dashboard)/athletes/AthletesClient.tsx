'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { athleteColumns } from './AthleteTableColumns';
import { AthleteForm } from './AthleteForm';
import { cn } from '@/utils/cn';
import { exportToCsv } from '@/lib/utils/csvExport';
import { useToastStore } from '@/components/ui/Toast';
import { bulkUpdateStatusAction, bulkAssignProgramAction } from './actions';
import { Plus, LayoutGrid, List, X, Download, UserCog, FolderSync } from 'lucide-react';
import type { Athlete, Sport, TrainingProgram } from '@/types';

interface AthletesClientProps {
  athletes: Athlete[];
  sports: Sport[];
  programs: TrainingProgram[];
}

type ViewMode = 'table' | 'grid';
type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

function AthleteCard({ athlete, onClick }: { athlete: Athlete; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-black/20"
      padding="md"
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col items-center text-center"
      >
        <div className="relative mb-3">
          <Avatar
            src={athlete.photo?.thumbnails?.large?.url ?? athlete.photo?.url}
            name={athlete.name}
            size="lg"
          />
          <span
            className={cn(
              'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white',
              athlete.status === 'active' ? 'bg-success' : 'bg-gray-400'
            )}
          />
        </div>
        <h3 className="text-sm font-semibold text-black">{athlete.name}</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          {athlete.sportName || 'No sport'}
        </p>
        {athlete.position && (
          <p className="mt-0.5 text-xs text-gray-400">{athlete.position}</p>
        )}
        <div className="mt-2">
          <Badge variant={athlete.status === 'active' ? 'success' : 'default'}>
            {athlete.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </button>
    </Card>
  );
}

export function AthletesClient({ athletes, sports, programs }: AthletesClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const filteredAthletes = useMemo(() => {
    if (statusFilter === 'all') return athletes;
    return athletes.filter((a) => a.status === statusFilter);
  }, [athletes, statusFilter]);

  const counts = useMemo(() => ({
    all: athletes.length,
    active: athletes.filter((a) => a.status === 'active').length,
    inactive: athletes.filter((a) => a.status === 'inactive').length,
  }), [athletes]);

  const selectedCount = selectedIds.size;

  async function handleBulkStatus(status: 'active' | 'inactive') {
    setBulkLoading(true);
    const result = await bulkUpdateStatusAction(Array.from(selectedIds), status);
    if (result.success) {
      addToast(`${result.count} athlete(s) set to ${status}`, 'success');
      setSelectedIds(new Set());
      router.refresh();
    } else {
      addToast(result.error || 'Failed', 'error');
    }
    setBulkLoading(false);
  }

  async function handleBulkAssignProgram(programId: string) {
    setBulkLoading(true);
    const result = await bulkAssignProgramAction(Array.from(selectedIds), programId);
    if (result.success) {
      addToast(`${result.count} athlete(s) assigned to program`, 'success');
      setSelectedIds(new Set());
      router.refresh();
    } else {
      addToast(result.error || 'Failed', 'error');
    }
    setBulkLoading(false);
  }

  function handleExportSelected() {
    const selected = athletes.filter((a) => selectedIds.has(a.id));
    const headers = ['Name', 'Sport', 'Program', 'Position', 'Status', 'DOB'];
    const rows = selected.map((a) => [
      a.name, a.sportName || '', a.programName || '', a.position || '', a.status, a.dateOfBirth || '',
    ]);
    exportToCsv('selected_athletes.csv', headers, rows);
    addToast(`${selected.length} athlete(s) exported`, 'success');
  }

  return (
    <>
      <PageHeader
        title="Athletes"
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-md border border-border">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center justify-center rounded-l-md px-2.5 py-1.5 transition-colors',
                  viewMode === 'table' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:text-black'
                )}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center justify-center rounded-r-md px-2.5 py-1.5 transition-colors',
                  viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:text-black'
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
              Add Athlete
            </Button>
          </div>
        }
      />

      {athletes.length === 0 ? (
        <EmptyState
          icon="athletes"
          title="No athletes yet"
          description="Add your first athlete to start tracking performance, load, and injuries."
          actionLabel="Add Athlete"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <>
          {/* Status filter tabs */}
          <div className="mb-4 flex items-center gap-1 border-b border-border">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'relative px-4 py-2.5 text-sm font-medium transition-colors',
                  statusFilter === tab.value
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                )}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-gray-400">
                  {counts[tab.value]}
                </span>
                {statusFilter === tab.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                )}
              </button>
            ))}
          </div>

          {viewMode === 'table' ? (
            <InteractiveTable
              columns={athleteColumns}
              data={filteredAthletes}
              onRowClick={(athlete) => router.push(`/athletes/${athlete.id}`)}
              searchPlaceholder="Search athletes..."
              enableSelection
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredAthletes.map((athlete) => (
                <AthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  onClick={() => router.push(`/athletes/${athlete.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Athlete"
      >
        <AthleteForm
          sports={sports}
          programs={programs}
          onSuccess={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Floating bulk actions bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 shadow-lg">
            <span className="text-sm font-semibold text-black">
              {selectedCount} selected
            </span>
            <div className="mx-1 h-5 w-px bg-border" />

            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkStatus('active')}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10 transition-colors disabled:opacity-50"
            >
              <UserCog className="h-3.5 w-3.5" />
              Set Active
            </button>
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkStatus('inactive')}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <UserCog className="h-3.5 w-3.5" />
              Set Inactive
            </button>

            <div className="mx-1 h-5 w-px bg-border" />

            <select
              disabled={bulkLoading}
              onChange={(e) => { if (e.target.value) handleBulkAssignProgram(e.target.value); e.target.value = ''; }}
              className="rounded-md border border-border bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-black focus:outline-none disabled:opacity-50"
              defaultValue=""
            >
              <option value="" disabled>
                <FolderSync className="h-3.5 w-3.5" />
                Assign Program
              </option>
              <option value="">None (clear)</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="mx-1 h-5 w-px bg-border" />

            <button
              type="button"
              onClick={handleExportSelected}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="ml-1 flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
