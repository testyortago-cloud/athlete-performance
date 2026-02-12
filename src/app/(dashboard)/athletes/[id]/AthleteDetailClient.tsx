'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { AthleteForm } from '../AthleteForm';
import { deleteAthleteAction, updateAthleteNotesAction } from '../actions';
import { AthleteAnalytics } from './AthleteAnalytics';
import {
  Pencil,
  Trash2,
  Download,
  BarChart3,
  Activity,
  Dumbbell,
  ClipboardCheck,
  AlertTriangle,
  Save,
  StickyNote,
  Trophy,
  User,
  BookOpen,
  Calendar,
  HeartPulse,
  ChevronRight,
  Link2,
} from 'lucide-react';
import { exportToCsv } from '@/lib/utils/csvExport';
import { useToastStore } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import type {
  Athlete,
  Sport,
  TrainingProgram,
  Injury,
  DailyLoad,
  TestingSession,
  Metric,
  PerformanceTrend,
  LoadTrend,
  RiskIndicator,
} from '@/types';

interface AthleteDetailClientProps {
  athlete: Athlete;
  sports: Sport[];
  programs: TrainingProgram[];
  injuries: Injury[];
  dailyLoads: DailyLoad[];
  testingSessions: TestingSession[];
  metrics: Metric[];
  performanceTrends: PerformanceTrend[];
  loadTrends: LoadTrend[];
  riskIndicator: RiskIndicator | null;
  avgRpeWeek: number;
  totalDaysLost: number;
}

type TabId = 'overview' | 'load' | 'testing' | 'injuries';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'load', label: 'Load History', icon: <Dumbbell className="h-3.5 w-3.5" /> },
  { id: 'testing', label: 'Testing Results', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
  { id: 'injuries', label: 'Injuries', icon: <HeartPulse className="h-3.5 w-3.5" /> },
];

export function AthleteDetailClient({
  athlete,
  sports,
  programs,
  injuries,
  dailyLoads,
  testingSessions,
  metrics,
  performanceTrends,
  loadTrends,
  riskIndicator,
  avgRpeWeek,
  totalDaysLost,
}: AthleteDetailClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [notes, setNotes] = useState(athlete.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const notesDirty = notes !== (athlete.notes || '');

  // ── Computed Values ──────────────────────────────────────────────
  const riskLevel = riskIndicator?.riskLevel || 'low';

  const age = athlete.dateOfBirth
    ? Math.floor(
        (Date.now() - new Date(athlete.dateOfBirth).getTime()) / (365.25 * 86400000)
      )
    : null;

  const dob = athlete.dateOfBirth
    ? new Date(athlete.dateOfBirth).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const activeInjuryCount = injuries.filter((i) => i.status !== 'resolved').length;

  const daysSinceLastInjury = useMemo(() => {
    const injuryDates = injuries
      .filter((i) => i.dateOccurred)
      .sort((a, b) => new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime());
    if (injuryDates.length === 0) return null;
    return Math.floor(
      (Date.now() - new Date(injuryDates[0].dateOccurred).getTime()) / 86400000
    );
  }, [injuries]);

  const maxTrainingLoad = useMemo(
    () => Math.max(...dailyLoads.map((l) => l.trainingLoad), 1),
    [dailyLoads]
  );

  // ── Handlers ─────────────────────────────────────────────────────
  function handleShareProfile() {
    const publicUrl = `${window.location.origin}/p/${athlete.id}`;
    navigator.clipboard.writeText(publicUrl).then(
      () => addToast('Public profile link copied to clipboard', 'success'),
      () => addToast('Failed to copy link', 'error')
    );
  }

  function handleExportCsv() {
    const headers = ['Date', 'Metric', 'Best Score', 'Average Score'];
    const rows = performanceTrends.map((t) => {
      const metric = metrics.find((m) => m.id === t.metricName);
      return [t.date, metric?.name || t.metricName, t.bestScore, t.averageScore];
    });
    exportToCsv(`${athlete.name.replace(/\s+/g, '_')}_performance.csv`, headers, rows);
    addToast('CSV exported successfully', 'success');
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    const result = await updateAthleteNotesAction(athlete.id, notes);
    if (result.success) {
      addToast('Notes saved', 'success');
      router.refresh();
    } else {
      addToast(result.error || 'Failed to save notes', 'error');
    }
    setSavingNotes(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAthleteAction(athlete.id);
    if (result.success) {
      addToast('Athlete deleted successfully', 'success');
      router.push('/athletes');
      router.refresh();
    }
    setDeleting(false);
  }

  // ── Hero card helpers ────────────────────────────────────────────
  const infoLine = [athlete.sportName, athlete.position, age != null ? `${age} yrs` : null]
    .filter(Boolean)
    .join(' · ');

  const riskRingColor =
    riskLevel === 'high'
      ? 'bg-gradient-to-br from-red-400 to-red-600'
      : riskLevel === 'moderate'
        ? 'bg-gradient-to-br from-amber-400 to-amber-600'
        : 'bg-gradient-to-br from-emerald-400 to-emerald-600';

  const acwrHeroColor =
    riskLevel === 'high'
      ? 'text-red-400'
      : riskLevel === 'moderate'
        ? 'text-amber-400'
        : 'text-emerald-400';

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      {/* Breadcrumbs */}
      <PageHeader
        title={athlete.name}
        breadcrumbs={[{ label: 'Athletes', href: '/athletes' }, { label: athlete.name }]}
      />

      {/* ─── Hero Profile Card ─────────────────────────────────── */}
      <div className="mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar with risk ring */}
            <div className="relative shrink-0 self-center sm:self-auto">
              <div className={cn('rounded-full p-[3px]', riskRingColor)}>
                <div className="rounded-full bg-gray-900 p-[3px]">
                  <Avatar
                    src={athlete.photo?.thumbnails?.large?.url ?? athlete.photo?.url}
                    name={athlete.name}
                    size="lg"
                  />
                </div>
              </div>
              <div
                className={cn(
                  'absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-gray-900',
                  athlete.status === 'active' ? 'bg-success' : 'bg-gray-500'
                )}
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                <h2 className="text-2xl font-bold text-white">{athlete.name}</h2>
                <Badge variant={athlete.status === 'active' ? 'success' : 'default'}>
                  {athlete.status}
                </Badge>
                {riskLevel !== 'low' && riskIndicator && (
                  <Badge variant={riskLevel === 'high' ? 'danger' : 'warning'}>
                    {riskLevel} risk
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-white/50">
                {infoLine || 'No sport assigned'}
              </p>
              {athlete.programName && (
                <p className="mt-0.5 text-xs text-white/30">{athlete.programName}</p>
              )}

              {/* Quick stat strip */}
              <div className="mt-5 inline-flex flex-wrap justify-center gap-6 sm:justify-start sm:gap-8">
                <StatCell value={dailyLoads.length} label="Load Entries" />
                <Divider />
                <StatCell value={testingSessions.length} label="Test Sessions" />
                <Divider />
                <StatCell
                  value={daysSinceLastInjury != null ? daysSinceLastInjury : '—'}
                  label="Days Injury-Free"
                />
                <Divider />
                <StatCell
                  value={riskIndicator?.acwr ?? '—'}
                  label="ACWR"
                  valueClassName={acwrHeroColor}
                />
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden shrink-0 gap-2 sm:flex">
              <HeroButton icon={<Link2 className="h-3.5 w-3.5" />} label="Share" onClick={handleShareProfile} />
              <HeroButton icon={<BarChart3 className="h-3.5 w-3.5" />} label="Compare" onClick={() => router.push('/analytics/comparisons')} />
              <HeroButton icon={<Pencil className="h-3.5 w-3.5" />} label="Edit" onClick={() => setShowEditModal(true)} />
              <HeroButton icon={<Download className="h-3.5 w-3.5" />} label="Export" onClick={handleExportCsv} />
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-center rounded-lg bg-white/5 p-2.5 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                title="Delete athlete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile actions */}
          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:hidden">
            <HeroButton icon={<Link2 className="h-3.5 w-3.5" />} label="Share" onClick={handleShareProfile} />
            <HeroButton icon={<BarChart3 className="h-3.5 w-3.5" />} label="Compare" onClick={() => router.push('/analytics/comparisons')} />
            <HeroButton icon={<Pencil className="h-3.5 w-3.5" />} label="Edit" onClick={() => setShowEditModal(true)} />
            <HeroButton icon={<Download className="h-3.5 w-3.5" />} label="Export" onClick={handleExportCsv} />
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center rounded-lg bg-white/5 p-2.5 text-red-400 transition-colors hover:bg-red-500/10"
              title="Delete athlete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Risk Alert Banner ─────────────────────────────────── */}
      {riskIndicator && riskLevel !== 'low' && (
        <div
          className={cn(
            'mb-6 flex items-start gap-3 rounded-lg border-l-4 px-4 py-3',
            riskLevel === 'high' ? 'border-danger bg-danger/5' : 'border-warning bg-warning/5'
          )}
        >
          <AlertTriangle
            className={cn(
              'mt-0.5 h-5 w-5 shrink-0',
              riskLevel === 'high' ? 'text-danger' : 'text-warning'
            )}
          />
          <div>
            <p
              className={cn(
                'text-sm font-semibold',
                riskLevel === 'high' ? 'text-danger' : 'text-warning'
              )}
            >
              {riskLevel === 'high' ? 'High Injury Risk' : 'Elevated Injury Risk'} — ACWR{' '}
              {riskIndicator.acwr}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {riskIndicator.trajectory === 'worsening'
                ? 'Risk trend is worsening. Consider reducing training load.'
                : riskIndicator.trajectory === 'improving'
                  ? 'Risk trend is improving. Continue monitoring closely.'
                  : 'Risk is stable. Monitor training load closely.'}
            </p>
          </div>
        </div>
      )}

      {/* ─── Tab Navigation ────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id ? 'text-black' : 'text-gray-400 hover:text-black'
            )}
          >
            <span
              className={cn(
                activeTab === tab.id ? 'text-black' : 'text-gray-300'
              )}
            >
              {tab.icon}
            </span>
            {tab.label}
            {tab.id === 'injuries' && activeInjuryCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {activeInjuryCount}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Main content — 2 cols */}
          <div className="space-y-6 lg:col-span-2">
            <AthleteAnalytics
              metrics={metrics}
              performanceTrends={performanceTrends}
              loadTrends={loadTrends}
              riskIndicator={riskIndicator}
              avgRpeWeek={avgRpeWeek}
              totalDaysLost={totalDaysLost}
            />

            {/* Activity Timeline */}
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-black">Activity Timeline</h3>
              <ActivityTimeline
                dailyLoads={dailyLoads}
                testingSessions={testingSessions}
                injuries={injuries}
                onNavigate={(href) => router.push(href)}
              />
            </Card>

            {/* Return-to-Play Progress */}
            {injuries.filter((i) => i.status !== 'resolved').length > 0 && (
              <Card>
                <h3 className="mb-4 text-lg font-semibold text-black">
                  Return-to-Play Progress
                </h3>
                <div className="space-y-4">
                  {injuries
                    .filter((i) => i.status !== 'resolved')
                    .map((injury) => {
                      const daysSinceInjury = Math.max(
                        1,
                        Math.floor(
                          (Date.now() - new Date(injury.dateOccurred).getTime()) / 86400000
                        )
                      );
                      const estimatedRecovery = 21;
                      const progress = Math.min(
                        Math.round((daysSinceInjury / estimatedRecovery) * 100),
                        100
                      );
                      const isOverdue = daysSinceInjury > estimatedRecovery;

                      return (
                        <button
                          key={injury.id}
                          type="button"
                          onClick={() => router.push(`/injuries/${injury.id}`)}
                          className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-gray-50"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-black">
                                {injury.bodyRegion}
                              </span>
                              {injury.type && (
                                <span className="text-xs text-gray-500">({injury.type})</span>
                              )}
                            </div>
                            <span
                              className={cn(
                                'text-xs font-medium',
                                isOverdue ? 'text-danger' : 'text-gray-500'
                              )}
                            >
                              Day {daysSinceInjury} / ~{estimatedRecovery}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                isOverdue
                                  ? 'bg-danger'
                                  : progress > 75
                                    ? 'bg-success'
                                    : progress > 40
                                      ? 'bg-warning'
                                      : 'bg-danger/60'
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-gray-400">
                            {isOverdue
                              ? `Recovery overdue by ${daysSinceInjury - estimatedRecovery} days`
                              : `${progress}% through estimated recovery`}
                          </p>
                        </button>
                      );
                    })}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar — 1 col */}
          <div className="mt-6 space-y-6 lg:mt-0">
            {/* Bio & Details */}
            <Card>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Bio & Details
              </h3>
              <div className="space-y-4">
                <BioRow icon={<Trophy className="h-4 w-4 text-gray-500" />} label="Sport" value={athlete.sportName || '—'} />
                <BioRow icon={<User className="h-4 w-4 text-gray-500" />} label="Position" value={athlete.position || '—'} />
                <BioRow icon={<BookOpen className="h-4 w-4 text-gray-500" />} label="Program" value={athlete.programName || '—'} />
                <BioRow icon={<Calendar className="h-4 w-4 text-gray-500" />} label="Date of Birth" value={dob} />
              </div>
            </Card>

            {/* Injury Summary */}
            <Card>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Injury Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat value={injuries.length} label="Total" />
                <MiniStat
                  value={activeInjuryCount}
                  label="Active"
                  className={activeInjuryCount > 0 ? 'bg-danger/5' : undefined}
                  valueClassName={activeInjuryCount > 0 ? 'text-danger' : undefined}
                />
                <MiniStat
                  value={totalDaysLost}
                  label="Days Lost"
                  valueClassName={totalDaysLost > 0 ? 'text-danger' : undefined}
                />
                <MiniStat
                  value={daysSinceLastInjury != null ? daysSinceLastInjury : '—'}
                  label="Injury-Free"
                  className={daysSinceLastInjury != null && daysSinceLastInjury > 30 ? 'bg-success/5' : undefined}
                  valueClassName={daysSinceLastInjury != null && daysSinceLastInjury > 30 ? 'text-success' : undefined}
                />
              </div>
            </Card>

            {/* Notes */}
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Notes
                  </h3>
                </div>
                {notesDirty && (
                  <Button
                    size="sm"
                    icon={<Save className="h-3.5 w-3.5" />}
                    onClick={handleSaveNotes}
                    loading={savingNotes}
                  >
                    Save
                  </Button>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this athlete..."
                rows={4}
                className="w-full resize-none rounded-md border border-border bg-muted px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              {notes && !notesDirty && (
                <p className="mt-1 text-[10px] text-gray-400">Last saved</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ─── Load History Tab ──────────────────────────────────── */}
      {activeTab === 'load' && (
        <>
          {/* Summary strip */}
          {dailyLoads.length > 0 && (
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-white p-3 text-center">
                <p className="text-lg font-bold text-black">{dailyLoads.length}</p>
                <p className="text-[11px] text-gray-400">Sessions</p>
              </div>
              <div className="rounded-lg border border-border bg-white p-3 text-center">
                <p className="text-lg font-bold text-black">
                  {(dailyLoads.reduce((s, l) => s + l.rpe, 0) / dailyLoads.length).toFixed(1)}
                </p>
                <p className="text-[11px] text-gray-400">Avg RPE</p>
              </div>
              <div className="rounded-lg border border-border bg-white p-3 text-center">
                <p className="text-lg font-bold text-black">
                  {dailyLoads.reduce((s, l) => s + l.trainingLoad, 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400">Total Load</p>
              </div>
            </div>
          )}

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-black">Training Load History</h3>
            {dailyLoads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Dumbbell className="mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">No load entries recorded</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-3 py-2 font-medium text-gray-500">Date</th>
                      <th className="px-3 py-2 font-medium text-gray-500">Session Type</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">RPE</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Duration</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Load</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyLoads.map((l) => (
                      <tr
                        key={l.id}
                        className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                        onClick={() => router.push(`/load-monitoring/${l.id}`)}
                      >
                        <td className="px-3 py-2.5 text-black">
                          {new Date(l.date).toLocaleDateString('en-AU', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{l.sessionType}</td>
                        <td className="px-3 py-2.5 text-right">
                          <Badge
                            variant={
                              l.rpe <= 3 ? 'success' : l.rpe <= 6 ? 'warning' : 'danger'
                            }
                          >
                            {l.rpe}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600">
                          {l.durationMinutes} min
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-black"
                                style={{
                                  width: `${Math.min(100, (l.trainingLoad / maxTrainingLoad) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="w-10 text-right font-semibold text-black">
                              {l.trainingLoad}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ─── Testing Results Tab ───────────────────────────────── */}
      {activeTab === 'testing' && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">Testing Sessions</h3>
          {testingSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">No testing sessions recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {testingSessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => router.push(`/testing/${s.id}`)}
                  className="group flex w-full items-center gap-4 rounded-lg border border-border p-4 text-sm transition-all hover:border-gray-300 hover:shadow-sm"
                >
                  {/* Date badge */}
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
                    <span className="text-lg font-bold leading-none text-black">
                      {new Date(s.date).getDate()}
                    </span>
                    <span className="text-[10px] font-medium uppercase text-gray-400">
                      {new Date(s.date).toLocaleDateString('en-AU', { month: 'short' })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-medium text-black">Testing Session</p>
                    {s.notes && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">{s.notes}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-black" />
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Injuries Tab ──────────────────────────────────────── */}
      {activeTab === 'injuries' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">Injury History</h3>
            {activeInjuryCount > 0 && (
              <Badge variant="danger">{activeInjuryCount} active</Badge>
            )}
          </div>
          {injuries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <HeartPulse className="mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">No injuries recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {injuries.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => router.push(`/injuries/${i.id}`)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-all hover:shadow-sm',
                    i.status !== 'resolved'
                      ? 'border-l-[3px] border-l-danger hover:bg-danger/5'
                      : 'border-l-[3px] border-l-success hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={i.status !== 'resolved' ? 'danger' : 'success'}>
                      {i.status !== 'resolved' ? 'Active' : 'Resolved'}
                    </Badge>
                    <div className="text-left">
                      <span className="font-medium text-black">{i.bodyRegion}</span>
                      {i.type && <span className="ml-2 text-gray-500">({i.type})</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">
                      {new Date(i.dateOccurred).toLocaleDateString('en-AU', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {i.daysLost != null && i.daysLost > 0 && (
                      <p className="text-xs text-gray-400">{i.daysLost} days lost</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Modals ────────────────────────────────────────────── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Athlete">
        <AthleteForm
          athlete={athlete}
          sports={sports}
          programs={programs}
          onSuccess={() => setShowEditModal(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Athlete"
        message={`Are you sure you want to delete ${athlete.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────

function StatCell({
  value,
  label,
  valueClassName,
}: {
  value: string | number;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <p className={cn('text-xl font-bold text-white', valueClassName)}>{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}

function Divider() {
  return <div className="hidden h-10 w-px self-center bg-white/10 sm:block" />;
}

function HeroButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20"
    >
      {icon}
      {label}
    </button>
  );
}

function BioRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="truncate text-sm font-medium text-black">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({
  value,
  label,
  className,
  valueClassName,
}: {
  value: string | number;
  label: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn('rounded-lg bg-muted p-3 text-center', className)}>
      <p className={cn('text-2xl font-bold text-black', valueClassName)}>{value}</p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  );
}

function ActivityTimeline({
  dailyLoads,
  testingSessions,
  injuries,
  onNavigate,
}: {
  dailyLoads: DailyLoad[];
  testingSessions: TestingSession[];
  injuries: Injury[];
  onNavigate: (href: string) => void;
}) {
  type TimelineEvent = {
    id: string;
    date: string;
    type: 'load' | 'test' | 'injury';
    label: string;
    detail: string;
    badge?: { text: string; variant: 'success' | 'warning' | 'danger' | 'default' | 'outline' };
    href: string;
  };

  const events: TimelineEvent[] = [
    ...dailyLoads.map((l) => ({
      id: `load-${l.id}`,
      date: l.date,
      type: 'load' as const,
      label: `${l.sessionType} session`,
      detail: `Load ${l.trainingLoad} · ${l.durationMinutes}min`,
      badge: {
        text: `RPE ${l.rpe}`,
        variant: (l.rpe <= 3 ? 'success' : l.rpe <= 6 ? 'warning' : 'danger') as
          | 'success'
          | 'warning'
          | 'danger',
      },
      href: `/load-monitoring/${l.id}`,
    })),
    ...testingSessions.map((s) => ({
      id: `test-${s.id}`,
      date: s.date,
      type: 'test' as const,
      label: 'Testing session',
      detail: s.notes || 'No notes',
      badge: { text: 'Test', variant: 'outline' as const },
      href: `/testing/${s.id}`,
    })),
    ...injuries.map((i) => ({
      id: `injury-${i.id}`,
      date: i.dateOccurred,
      type: 'injury' as const,
      label: `${i.bodyRegion} ${i.type || 'injury'}`,
      detail:
        i.status !== 'resolved' ? 'Active' : `Resolved · ${i.daysLost ?? 0}d lost`,
      badge: {
        text: i.status !== 'resolved' ? 'Active' : 'Resolved',
        variant: (i.status !== 'resolved' ? 'danger' : 'success') as 'danger' | 'success',
      },
      href: `/injuries/${i.id}`,
    })),
  ];

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recent = events.slice(0, 8);

  const typeIcon = {
    load: <Dumbbell className="h-3.5 w-3.5 text-black" />,
    test: <ClipboardCheck className="h-3.5 w-3.5 text-blue-600" />,
    injury: <AlertTriangle className="h-3.5 w-3.5 text-danger" />,
  };
  const typeBg = {
    load: 'bg-gray-100',
    test: 'bg-blue-50',
    injury: 'bg-danger/10',
  };

  if (recent.length === 0) {
    return <p className="text-sm text-gray-500">No activity recorded.</p>;
  }

  return (
    <div className="relative">
      <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border" />
      <div className="space-y-0">
        {recent.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onNavigate(event.href)}
            className="relative flex w-full items-start gap-3 rounded-md px-1 py-2 text-left text-sm transition-colors hover:bg-gray-50"
          >
            <div
              className={cn(
                'relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full',
                typeBg[event.type]
              )}
            >
              {typeIcon[event.type]}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-black">{event.label}</span>
                {event.badge && (
                  <Badge
                    variant={event.badge.variant}
                    className="shrink-0 px-1.5 py-0 text-[10px]"
                  >
                    {event.badge.text}
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {new Date(event.date).toLocaleDateString('en-AU', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
                <span className="truncate text-xs text-gray-500">{event.detail}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
