'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { loadMonitoringColumns } from './LoadMonitoringTableColumns';
import { DailyLoadForm } from './DailyLoadForm';
import { BatchLoadForm } from './BatchLoadForm';
import { exportToCsv } from '@/lib/utils/csvExport';
import { HelpTip } from '@/components/ui/HelpTip';
import { cn } from '@/utils/cn';
import { Plus, TrendingUp, TrendingDown, Minus, Grid3X3, Download } from 'lucide-react';
import type { DailyLoad, Athlete } from '@/types';

interface LoadMonitoringClientProps {
  loads: DailyLoad[];
  athletes: Athlete[];
}

interface WeeklyStats {
  totalLoad: number;
  avgLoad: number;
  avgRpe: number;
  sessions: number;
  prevTotalLoad: number;
}

function getLoadZone(avgLoad: number): { label: string; color: string; bgColor: string } {
  if (avgLoad === 0) return { label: 'No Data', color: 'text-gray-400', bgColor: 'bg-gray-50' };
  if (avgLoad < 200) return { label: 'Recovery', color: 'text-success', bgColor: 'bg-success/5' };
  if (avgLoad < 400) return { label: 'Optimal', color: 'text-black', bgColor: 'bg-muted' };
  if (avgLoad < 600) return { label: 'Overreach', color: 'text-warning', bgColor: 'bg-warning/5' };
  return { label: 'Danger', color: 'text-danger', bgColor: 'bg-danger/5' };
}

function LoadZoneBar({ avgLoad }: { avgLoad: number }) {
  const zones = [
    { label: 'Recovery', min: 0, max: 200, color: 'bg-success' },
    { label: 'Optimal', min: 200, max: 400, color: 'bg-black' },
    { label: 'Overreach', min: 400, max: 600, color: 'bg-warning' },
    { label: 'Danger', min: 600, max: 800, color: 'bg-danger' },
  ];

  const maxVal = 800;
  const position = Math.min((avgLoad / maxVal) * 100, 100);

  return (
    <div className="mt-3">
      <div className="flex gap-0.5 rounded-full overflow-hidden h-2">
        {zones.map((zone) => (
          <div
            key={zone.label}
            className={cn(zone.color, 'flex-1 opacity-20')}
          />
        ))}
      </div>
      {avgLoad > 0 && (
        <div className="relative mt-1" style={{ paddingLeft: `${position}%` }}>
          <div className="absolute -top-3 -ml-1 h-4 w-0.5 bg-black rounded-full" />
        </div>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        {zones.map((zone) => (
          <span key={zone.label}>{zone.label}</span>
        ))}
      </div>
    </div>
  );
}

export function LoadMonitoringClient({ loads, athletes }: LoadMonitoringClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const weeklyStats = useMemo<WeeklyStats>(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

    const thisWeek = loads.filter((l) => new Date(l.date) >= sevenDaysAgo);
    const prevWeek = loads.filter((l) => {
      const d = new Date(l.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const totalLoad = thisWeek.reduce((s, l) => s + l.trainingLoad, 0);
    const avgLoad = thisWeek.length > 0 ? Math.round(totalLoad / thisWeek.length) : 0;
    const avgRpe = thisWeek.length > 0
      ? Math.round((thisWeek.reduce((s, l) => s + l.rpe, 0) / thisWeek.length) * 10) / 10
      : 0;
    const prevTotalLoad = prevWeek.reduce((s, l) => s + l.trainingLoad, 0);

    return {
      totalLoad,
      avgLoad,
      avgRpe,
      sessions: thisWeek.length,
      prevTotalLoad,
    };
  }, [loads]);

  const loadChange = weeklyStats.prevTotalLoad > 0
    ? Math.round(((weeklyStats.totalLoad - weeklyStats.prevTotalLoad) / weeklyStats.prevTotalLoad) * 100)
    : 0;

  const zone = getLoadZone(weeklyStats.avgLoad);

  return (
    <>
      <PageHeader
        title="Load Monitoring"
        actions={
          <div className="flex items-center gap-2">
            {loads.length > 0 && (
              <Button
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                onClick={() => {
                  const headers = ['Date', 'Athlete', 'RPE', 'Duration (min)', 'Session Type', 'Training Load'];
                  const rows = loads.map((l) => [l.date, l.athleteName ?? '', l.rpe, l.durationMinutes, l.sessionType, l.trainingLoad]);
                  exportToCsv('load_monitoring.csv', headers, rows);
                }}
              >
                Export
              </Button>
            )}
            <Button variant="secondary" icon={<Grid3X3 className="h-4 w-4" />} onClick={() => setShowBatchModal(true)}>
              Batch Entry
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
              Add Entry
            </Button>
          </div>
        }
      />

      {loads.length === 0 ? (
        <EmptyState
          icon="load"
          title="No load entries yet"
          description="Start logging daily training loads to monitor athlete workload and prevent overtraining."
          actionLabel="Add Entry"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <>
          {/* Weekly summary cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card padding="md">
              <p className="text-sm text-gray-500">Weekly Total Load</p>
              <p className="mt-1 text-2xl font-bold text-black">{weeklyStats.totalLoad}</p>
              {loadChange !== 0 && (
                <div className="mt-1 flex items-center gap-1">
                  {loadChange > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-danger" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-success" />
                  )}
                  <span className={cn('text-xs font-medium', loadChange > 0 ? 'text-danger' : 'text-success')}>
                    {loadChange > 0 ? '+' : ''}{loadChange}%
                  </span>
                  <span className="text-xs text-gray-400">vs last week</span>
                </div>
              )}
            </Card>

            <Card padding="md">
              <p className="text-sm text-gray-500">Avg Load / Session</p>
              <p className="mt-1 text-2xl font-bold text-black">{weeklyStats.avgLoad}</p>
              <div className={cn('mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', zone.bgColor, zone.color)}>
                {zone.label}
              </div>
            </Card>

            <Card padding="md">
              <p className="flex items-center gap-1 text-sm text-gray-500">
                Avg RPE (7d)
                <HelpTip term="RPE" description="Rate of Perceived Exertion — a 1-10 subjective scale where athletes rate how hard a session felt. Higher values indicate greater perceived effort." side="bottom" />
              </p>
              <p className="mt-1 text-2xl font-bold text-black">{weeklyStats.avgRpe}</p>
              <div className="mt-1 flex items-center gap-1">
                {weeklyStats.avgRpe <= 3 ? (
                  <Minus className="h-3.5 w-3.5 text-success" />
                ) : weeklyStats.avgRpe <= 6 ? (
                  <Minus className="h-3.5 w-3.5 text-warning" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-danger" />
                )}
                <span className={cn(
                  'text-xs font-medium',
                  weeklyStats.avgRpe <= 3 ? 'text-success' : weeklyStats.avgRpe <= 6 ? 'text-warning' : 'text-danger'
                )}>
                  {weeklyStats.avgRpe <= 3 ? 'Low' : weeklyStats.avgRpe <= 6 ? 'Moderate' : 'High'}
                </span>
              </div>
            </Card>

            <Card padding="md">
              <p className="text-sm text-gray-500">Sessions (7d)</p>
              <p className="mt-1 text-2xl font-bold text-black">{weeklyStats.sessions}</p>
              <p className="mt-1 text-xs text-gray-400">
                {athletes.length > 0 ? `across ${athletes.filter(a => a.status === 'active').length} athletes` : ''}
              </p>
            </Card>
          </div>

          {/* Load zone visualization */}
          <Card className="mb-6" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-black">Training Load Zone</h3>
                  <HelpTip term="Training Load" description="Calculated as RPE × Session Duration (minutes). Zones categorize average load into Low, Moderate, High, and Very High intensity bands." side="bottom" />
                </div>
                <p className="text-xs text-gray-500">Based on 7-day average load per session</p>
              </div>
              <div className={cn('rounded-full px-3 py-1 text-xs font-semibold', zone.bgColor, zone.color)}>
                {zone.label}
              </div>
            </div>
            <LoadZoneBar avgLoad={weeklyStats.avgLoad} />
          </Card>

          {/* Calendar heatmap */}
          <Card className="mb-6" padding="md">
            <h3 className="mb-3 text-sm font-semibold text-black">Load Calendar</h3>
            <p className="mb-3 text-xs text-gray-500">Daily average training load, last 12 weeks</p>
            <CalendarHeatmap
              data={(() => {
                // Aggregate loads by date (average per day)
                const dateMap = new Map<string, { total: number; count: number }>();
                for (const l of loads) {
                  const existing = dateMap.get(l.date);
                  if (existing) {
                    existing.total += l.trainingLoad;
                    existing.count += 1;
                  } else {
                    dateMap.set(l.date, { total: l.trainingLoad, count: 1 });
                  }
                }
                return Array.from(dateMap.entries()).map(([date, { total, count }]) => ({
                  date,
                  value: Math.round(total / count),
                }));
              })()}
            />
          </Card>

          <InteractiveTable
            columns={loadMonitoringColumns}
            data={loads}
            onRowClick={(load) => router.push(`/load-monitoring/${load.id}`)}
            searchPlaceholder="Search load entries..."
          />
        </>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Load Entry"
      >
        <DailyLoadForm
          athletes={athletes}
          onSuccess={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="Batch Load Entry"
        size="xl"
      >
        <BatchLoadForm
          athletes={athletes}
          onSuccess={() => setShowBatchModal(false)}
        />
      </Modal>
    </>
  );
}
