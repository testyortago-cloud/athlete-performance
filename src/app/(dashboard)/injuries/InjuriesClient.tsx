'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { BodyMap } from '@/components/charts/BodyMap';
import { injuryColumns } from './InjuryTableColumns';
import { InjuryForm } from './InjuryForm';
import { InjuryKanban } from './InjuryKanban';
import { exportToCsv } from '@/lib/utils/csvExport';
import { Plus, X, LayoutGrid, List, Download } from 'lucide-react';
import type { Injury, Athlete } from '@/types';

interface InjuriesClientProps {
  injuries: Injury[];
  athletes: Athlete[];
}

const REGION_FILTER_MAP: Record<string, string[]> = {
  head: ['head', 'face', 'jaw'],
  neck: ['neck', 'cervical'],
  'shoulder-l': ['shoulder'],
  'shoulder-r': ['shoulder'],
  chest: ['chest', 'thorax', 'ribs'],
  'upper-arm-l': ['upper arm', 'bicep'],
  'upper-arm-r': ['upper arm', 'bicep'],
  abdomen: ['abdomen', 'core', 'abdominal'],
  'lower-back': ['lower back', 'lumbar', 'back'],
  'upper-back': ['upper back', 'thoracic'],
  hip: ['hip', 'pelvis', 'groin'],
  'forearm-l': ['forearm', 'elbow'],
  'forearm-r': ['forearm', 'elbow'],
  'hand-l': ['hand', 'wrist', 'finger'],
  'hand-r': ['hand', 'wrist', 'finger'],
  'thigh-l': ['thigh', 'quadriceps', 'hamstring'],
  'thigh-r': ['thigh', 'quadriceps', 'hamstring'],
  'knee-l': ['knee'],
  'knee-r': ['knee'],
  'lower-leg-l': ['shin', 'calf', 'lower leg'],
  'lower-leg-r': ['shin', 'calf', 'lower leg'],
  'ankle-l': ['ankle'],
  'ankle-r': ['ankle'],
  'foot-l': ['foot', 'toe'],
  'foot-r': ['foot', 'toe'],
};

export function InjuriesClient({ injuries, athletes }: InjuriesClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [tableFilteredData, setTableFilteredData] = useState<Injury[] | null>(null);

  // Full heatmap always shows all injuries so users can click to filter
  const bodyMapData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const injury of injuries) {
      const region = injury.bodyRegion || 'Unknown';
      counts[region] = (counts[region] || 0) + 1;
    }
    return Object.entries(counts).map(([region, count]) => ({ region, count }));
  }, [injuries]);

  // Body-map region filter
  const filteredInjuries = useMemo(() => {
    if (!selectedRegion) return injuries;
    const terms = REGION_FILTER_MAP[selectedRegion] || [selectedRegion];
    return injuries.filter((i) => {
      const lower = i.bodyRegion.toLowerCase();
      return terms.some((t) => lower.includes(t));
    });
  }, [injuries, selectedRegion]);

  // The effective displayed data: table filters (search + column) on top of body-map filter
  // In kanban view there are no table filters, so fall back to filteredInjuries
  const displayedInjuries = view === 'table' && tableFilteredData !== null
    ? tableFilteredData
    : filteredInjuries;

  const isFiltered = displayedInjuries.length < injuries.length;

  // Summary region data derived from effective displayed injuries
  const summaryRegionData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const injury of displayedInjuries) {
      const region = injury.bodyRegion || 'Unknown';
      counts[region] = (counts[region] || 0) + 1;
    }
    return Object.entries(counts).map(([region, count]) => ({ region, count }));
  }, [displayedInjuries]);

  const handleTableFilterChange = useCallback((data: Injury[]) => {
    setTableFilteredData(data);
  }, []);

  function handleRegionClick(region: string) {
    setSelectedRegion((prev) => (prev === region ? null : region));
  }

  return (
    <>
      <PageHeader
        title="Injuries"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setView('table')}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  view === 'table' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  view === 'kanban' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            {injuries.length > 0 && (
              <Button
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                onClick={() => {
                  const headers = ['Athlete', 'Type', 'Body Region', 'Description', 'Date Occurred', 'Date Resolved', 'Status', 'Days Lost'];
                  const rows = displayedInjuries.map((i) => [
                    i.athleteName ?? '', i.type, i.bodyRegion, i.description,
                    i.dateOccurred, i.dateResolved ?? '', i.status, i.daysLost ?? '',
                  ]);
                  exportToCsv('injuries.csv', headers, rows);
                }}
              >
                Export
              </Button>
            )}
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
              Log Injury
            </Button>
          </div>
        }
      />

      {injuries.length === 0 ? (
        <EmptyState
          icon="injuries"
          title="No injuries recorded"
          description="When injuries occur, log them here to track recovery timelines and days lost."
          actionLabel="Log Injury"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <>
          {/* Body map + summary */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="flex flex-col items-center justify-center lg:col-span-1">
              <h3 className="mb-3 text-sm font-semibold text-black">Injury Heat Map</h3>
              <BodyMap
                data={bodyMapData}
                onRegionClick={handleRegionClick}
                selectedRegion={selectedRegion}
              />
              {selectedRegion && (
                <button
                  type="button"
                  onClick={() => setSelectedRegion(null)}
                  className="mt-2 flex items-center gap-1 rounded-md bg-black px-2.5 py-1 text-xs font-medium text-white hover:bg-dark transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear filter
                </button>
              )}
            </Card>

            <Card className="lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-black">
                Injury Summary
                {isFiltered && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({displayedInjuries.length} of {injuries.length})
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-black">
                    {displayedInjuries.filter((i) => i.status !== 'resolved').length}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Active Injuries</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-black">
                    {displayedInjuries.filter((i) => i.status === 'resolved').length}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Resolved</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-black">
                    {displayedInjuries.reduce((s, i) => s + (i.daysLost ?? 0), 0)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Total Days Lost</p>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Top Affected Regions</h4>
                <div className="space-y-2">
                  {summaryRegionData
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((d) => {
                      const maxCount = Math.max(...summaryRegionData.map((b) => b.count));
                      return (
                        <div key={d.region} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-black">{d.region}</span>
                              <span className="text-gray-500">{d.count}</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                              <div
                                className="h-1.5 rounded-full bg-black"
                                style={{ width: `${(d.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Card>
          </div>

          {isFiltered && (
            <p className="mb-2 text-sm text-gray-500">
              Showing {displayedInjuries.length} of {injuries.length} injuries
            </p>
          )}

          {view === 'kanban' ? (
            <InjuryKanban injuries={filteredInjuries} />
          ) : (
            <InteractiveTable
              columns={injuryColumns}
              data={filteredInjuries}
              onRowClick={(injury) => router.push(`/injuries/${injury.id}`)}
              searchPlaceholder="Search injuries..."
              onFilteredDataChange={handleTableFilterChange}
            />
          )}
        </>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Log Injury"
        size="lg"
      >
        <InjuryForm
          athletes={athletes}
          onSuccess={() => setShowCreateModal(false)}
        />
      </Modal>
    </>
  );
}
