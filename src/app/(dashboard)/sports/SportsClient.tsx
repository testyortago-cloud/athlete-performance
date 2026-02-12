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
import { SportForm } from './SportForm';
import { Plus, Trophy, Users, AlertTriangle, Layers } from 'lucide-react';
import type { Sport, ColumnDef } from '@/types';

interface EnrichedSport extends Sport {
  athleteCount: number;
  injuryCount: number;
}

const sportColumns: ColumnDef<EnrichedSport>[] = [
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
  {
    key: 'athleteCount' as keyof EnrichedSport,
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
    key: 'injuryCount' as keyof EnrichedSport,
    header: 'Active Injuries',
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

interface SportsClientProps {
  sports: EnrichedSport[];
  totalAthletes: number;
  totalInjuries: number;
}

export function SportsClient({ sports, totalAthletes, totalInjuries }: SportsClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const totalAthletesBySport = useMemo(
    () => sports.reduce((sum, s) => sum + s.athleteCount, 0),
    [sports]
  );

  const maxAthletes = useMemo(
    () => Math.max(...sports.map((s) => s.athleteCount), 1),
    [sports]
  );

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

      {sports.length > 0 && (
        <>
          {/* Summary stat cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <Trophy className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{sports.length}</p>
                  <p className="text-xs text-gray-500">Total Sports</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{totalAthletes}</p>
                  <p className="text-xs text-gray-500">Total Athletes</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{totalInjuries}</p>
                  <p className="text-xs text-gray-500">Active Injuries</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Layers className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">
                    {totalAthletes > 0 ? Math.round(totalAthletesBySport / sports.length * 10) / 10 : 0}
                  </p>
                  <p className="text-xs text-gray-500">Avg Athletes/Sport</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Athlete distribution chart */}
          <Card className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-black">Athlete Distribution</h3>
            <div className="space-y-2">
              {sports
                .sort((a, b) => b.athleteCount - a.athleteCount)
                .map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="w-24 truncate text-sm text-black">{s.name}</span>
                    <div className="flex-1">
                      <div className="h-5 rounded-full bg-gray-100">
                        <div
                          className="flex h-5 items-center rounded-full bg-black px-2"
                          style={{ width: `${Math.max((s.athleteCount / maxAthletes) * 100, s.athleteCount > 0 ? 8 : 0)}%` }}
                        >
                          {s.athleteCount > 0 && (
                            <span className="text-[10px] font-semibold text-white">{s.athleteCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {s.injuryCount > 0 && (
                      <Badge variant="warning">{s.injuryCount} injured</Badge>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}

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
