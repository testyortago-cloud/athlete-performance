'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { ChartCard } from '@/components/charts/ChartCard';
import { AnalyticsAreaChart } from '@/components/charts/AreaChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { AcwrGauge } from '@/components/charts/AcwrGauge';
import { BodyMap } from '@/components/charts/BodyMap';
import { DailyLoadForm } from '../DailyLoadForm';
import { deleteDailyLoadAction } from '../actions';
import { useToastStore } from '@/stores/toastStore';
import { cn } from '@/utils/cn';
import {
  Pencil,
  Trash2,
  Zap,
  Timer,
  Gauge,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Dumbbell,
} from 'lucide-react';
import type { DailyLoad, Athlete, Injury } from '@/types';

interface LoadDetailClientProps {
  load: DailyLoad;
  athletes: Athlete[];
  acwr?: number | null;
  athleteLoads?: DailyLoad[];
  activeInjuries?: Injury[];
}

function getRpeBadgeVariant(rpe: number): 'success' | 'warning' | 'danger' {
  if (rpe <= 3) return 'success';
  if (rpe <= 6) return 'warning';
  return 'danger';
}

function getLoadZone(load: number): { label: string; color: string; bgColor: string } {
  if (load < 200) return { label: 'Recovery', color: 'text-success', bgColor: 'bg-success' };
  if (load < 400) return { label: 'Optimal', color: 'text-blue-600', bgColor: 'bg-blue-500' };
  if (load < 600) return { label: 'Overreach', color: 'text-warning', bgColor: 'bg-warning' };
  return { label: 'Danger', color: 'text-danger', bgColor: 'bg-danger' };
}

export function LoadDetailClient({
  load,
  athletes,
  acwr,
  athleteLoads = [],
  activeInjuries = [],
}: LoadDetailClientProps) {
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

  const zone = getLoadZone(load.trainingLoad);

  // Weekly context — sessions in the same 7-day window as this entry
  const weeklyContext = useMemo(() => {
    const entryDate = new Date(load.date);
    const weekStart = new Date(entryDate);
    weekStart.setDate(weekStart.getDate() - 6);

    const weekLoads = athleteLoads.filter((l) => {
      const d = new Date(l.date);
      return d >= weekStart && d <= entryDate;
    });

    const totalLoad = weekLoads.reduce((s, l) => s + l.trainingLoad, 0);
    const avgRpe = weekLoads.length > 0
      ? Math.round((weekLoads.reduce((s, l) => s + l.rpe, 0) / weekLoads.length) * 10) / 10
      : 0;
    const pctOfWeek = totalLoad > 0 ? Math.round((load.trainingLoad / totalLoad) * 100) : 0;

    return { sessions: weekLoads.length, totalLoad, avgRpe, pctOfWeek };
  }, [load, athleteLoads]);

  // Training load trend — last 30 days
  const trendData = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 29);

    // Build a date → load map
    const dateMap = new Map<string, number>();
    for (const l of athleteLoads) {
      const d = new Date(l.date);
      if (d >= start && d <= today) {
        const key = l.date;
        dateMap.set(key, (dateMap.get(key) || 0) + l.trainingLoad);
      }
    }

    // Fill all 30 days
    const result: { date: string; Load: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = cursor.toISOString().split('T')[0];
      result.push({
        date: cursor.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
        Load: dateMap.get(key) || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [athleteLoads]);

  // Calendar heatmap data
  const calendarData = useMemo(() => {
    const dateMap = new Map<string, number>();
    for (const l of athleteLoads) {
      dateMap.set(l.date, (dateMap.get(l.date) || 0) + l.trainingLoad);
    }
    return Array.from(dateMap.entries()).map(([date, value]) => ({ date, value }));
  }, [athleteLoads]);

  // Session type breakdown
  const sessionTypeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of athleteLoads) {
      counts[l.sessionType] = (counts[l.sessionType] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [athleteLoads]);

  const totalSessionsAll = sessionTypeBreakdown.reduce((s, b) => s + b.count, 0);

  // Injury body map data
  const injuryBodyMapData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const injury of activeInjuries) {
      const region = injury.bodyRegion || 'Unknown';
      counts[region] = (counts[region] || 0) + 1;
    }
    return Object.entries(counts).map(([region, count]) => ({ region, count }));
  }, [activeInjuries]);

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

      {/* Quick stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', zone.bgColor + '/10')}>
              <Zap className={cn('h-4 w-4', zone.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{load.trainingLoad}</p>
              <p className="text-[11px] text-gray-500">Training Load</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              getRpeBadgeVariant(load.rpe) === 'success' ? 'bg-success/10'
                : getRpeBadgeVariant(load.rpe) === 'warning' ? 'bg-warning/10'
                : 'bg-danger/10',
            )}>
              <Gauge className={cn(
                'h-4 w-4',
                getRpeBadgeVariant(load.rpe) === 'success' ? 'text-success'
                  : getRpeBadgeVariant(load.rpe) === 'warning' ? 'text-warning'
                  : 'text-danger',
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{load.rpe}<span className="text-sm font-normal text-gray-400">/10</span></p>
              <p className="text-[11px] text-gray-500">RPE</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Timer className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{load.durationMinutes}<span className="text-sm font-normal text-gray-400"> min</span></p>
              <p className="text-[11px] text-gray-500">Duration</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              acwr != null && acwr > 1.5 ? 'bg-danger/10'
                : acwr != null && acwr > 1.3 ? 'bg-warning/10'
                : 'bg-success/10',
            )}>
              <TrendingUp className={cn(
                'h-4 w-4',
                acwr != null && acwr > 1.5 ? 'text-danger'
                  : acwr != null && acwr > 1.3 ? 'text-warning'
                  : 'text-success',
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{acwr != null ? acwr.toFixed(2) : '—'}</p>
              <p className="text-[11px] text-gray-500">ACWR</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Load zone indicator */}
      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black">Load Zone</h3>
          <Badge variant={
            zone.label === 'Recovery' ? 'success'
              : zone.label === 'Optimal' ? 'default'
              : zone.label === 'Overreach' ? 'warning'
              : 'danger'
          }>
            {zone.label}
          </Badge>
        </div>
        <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1/4 bg-success/20" />
          <div className="absolute inset-y-0 left-1/4 w-1/4 bg-blue-200/40" />
          <div className="absolute inset-y-0 left-2/4 w-1/4 bg-warning/30" />
          <div className="absolute inset-y-0 left-3/4 w-1/4 bg-danger/30" />
          {/* Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-black shadow"
            style={{ left: `${Math.min((load.trainingLoad / 800) * 100, 98)}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
          <span>0</span>
          <span>200</span>
          <span>400</span>
          <span>600</span>
          <span>800+</span>
        </div>
      </Card>

      {/* Active injuries alert */}
      {activeInjuries.length > 0 && (
        <Card className="mb-6 border-warning/30 bg-warning/[0.03]" padding="none">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-semibold text-black">
                  Active Injuries ({activeInjuries.length})
                </h3>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                {load.athleteName} has active injuries. Consider load modifications.
              </p>
              <div className="space-y-2">
                {activeInjuries.map((injury) => (
                  <div key={injury.id} className="flex items-center gap-2 text-sm">
                    <Badge variant={injury.status === 'active' ? 'danger' : injury.status === 'rehab' ? 'warning' : 'default'}>
                      {injury.status.charAt(0).toUpperCase() + injury.status.slice(1)}
                    </Badge>
                    <span className="font-medium text-black">{injury.bodyRegion}</span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-500">{injury.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <BodyMap data={injuryBodyMapData} compact />
            </div>
          </div>
        </Card>
      )}

      {/* Middle row: ACWR Gauge + Weekly Context + Session Details */}
      <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ACWR Gauge */}
        {acwr != null && (
          <Card className="flex flex-col items-center justify-center">
            <h3 className="mb-2 text-sm font-semibold text-black">Athlete ACWR</h3>
            <AcwrGauge value={acwr} size="md" />
          </Card>
        )}

        {/* Weekly context */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-black">7-Day Context</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Sessions This Week</dt>
              <dd className="text-sm font-medium text-black">{weeklyContext.sessions}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Weekly Total Load</dt>
              <dd className="text-sm font-medium text-black">{weeklyContext.totalLoad}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">This Session&apos;s Share</dt>
              <dd className="text-sm font-medium text-black">{weeklyContext.pctOfWeek}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Avg RPE (Week)</dt>
              <dd>
                <Badge variant={getRpeBadgeVariant(weeklyContext.avgRpe)}>
                  {weeklyContext.avgRpe}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>

        {/* Session details */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-black">Session Details</h3>
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
              <dd>
                <Badge variant="outline">
                  <Dumbbell className="mr-1 inline h-3 w-3" />
                  {load.sessionType}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Training Load</dt>
              <dd className="text-sm font-bold text-black">
                {load.rpe} x {load.durationMinutes} = {load.trainingLoad}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Training load trend chart */}
      {trendData.length > 0 && (
        <div className="mb-6">
          <ChartCard
            title="Training Load Trend"
            subtitle={`${load.athleteName}'s last 30 days`}
          >
            <AnalyticsAreaChart
              data={trendData}
              xKey="date"
              areas={[{ key: 'Load', color: '#000', name: 'Training Load' }]}
              height={220}
            />
          </ChartCard>
        </div>
      )}

      {/* Bottom row: Calendar heatmap + Session type breakdown */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Load Calendar"
          subtitle="Last 12 weeks"
          className="lg:col-span-2"
        >
          <CalendarHeatmap data={calendarData} />
        </ChartCard>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-black">
            Session Types
            <span className="ml-2 text-xs font-normal text-gray-400">{totalSessionsAll} total</span>
          </h3>
          <div className="space-y-2.5">
            {sessionTypeBreakdown.slice(0, 6).map((item) => {
              const pct = totalSessionsAll > 0 ? Math.round((item.count / totalSessionsAll) * 100) : 0;
              const isCurrent = item.type === load.sessionType;
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn('text-gray-600', isCurrent && 'font-semibold text-black')}>
                      {item.type}
                      {isCurrent && <Calendar className="ml-1 inline h-3 w-3 text-black" />}
                    </span>
                    <span className="text-xs text-gray-400">{item.count} ({pct}%)</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                    <div
                      className={cn('h-1.5 rounded-full', isCurrent ? 'bg-black' : 'bg-gray-300')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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
