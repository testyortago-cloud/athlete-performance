'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { AthleteForm } from '../AthleteForm';
import { deleteAthleteAction, updateAthleteNotesAction, deleteWellnessAction, deleteGoalAction, markGoalAchievedAction, deleteJournalAction } from '../actions';
import { AthleteAnalytics } from './AthleteAnalytics';
import { WellnessForm } from './WellnessForm';
import { GoalForm } from './GoalForm';
import { JournalForm } from './JournalForm';
import { AnalyticsRadarChart } from '@/components/charts/RadarChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { BodyMap } from '@/components/charts/BodyMap';
import { ChartCard } from '@/components/charts/ChartCard';
import { CHART_BLACK, CHART_GRAY } from '@/components/charts/chartColors';
import type { LoadZoneResult, WeekOverWeek, ComplianceRate, RiskFlag } from '@/lib/services/analyticsService';
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
  Sun,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  X,
  Shield,
  Zap,
  Target,
  Eye,
  EyeOff,
  ChevronDown,
  CheckCircle2,
  Circle,
  Award,
  Heart,
  BookOpenText,
  Hash,
  Search,
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
  WellnessCheckin,
  PersonalRecord,
  WeeklyVolumeSummary,
  Goal,
  JournalEntry,
  AchievementBadge,
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
  wellnessCheckins: WellnessCheckin[];
  personalRecords: PersonalRecord[];
  weeklyVolume: WeeklyVolumeSummary;
  radarData: { metric: string; Current: number; '30 Days Ago': number }[];
  trainingStreaks: { currentStreak: number; longestStreak: number };
  loadZones: LoadZoneResult;
  weekOverWeek: WeekOverWeek;
  compliance: ComplianceRate;
  riskFlags: RiskFlag[];
  goals: Goal[];
  journalEntries: JournalEntry[];
  badges: AchievementBadge[];
}

type TabId = 'overview' | 'load' | 'testing' | 'injuries' | 'wellness' | 'goals' | 'journal';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'load', label: 'Load History', icon: <Dumbbell className="h-3.5 w-3.5" /> },
  { id: 'testing', label: 'Testing Results', icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
  { id: 'injuries', label: 'Injuries', icon: <HeartPulse className="h-3.5 w-3.5" /> },
  { id: 'wellness', label: 'Wellness', icon: <Sun className="h-3.5 w-3.5" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="h-3.5 w-3.5" /> },
  { id: 'journal', label: 'Journal', icon: <BookOpenText className="h-3.5 w-3.5" /> },
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
  wellnessCheckins,
  personalRecords,
  weeklyVolume,
  radarData,
  trainingStreaks,
  loadZones,
  weekOverWeek,
  compliance,
  riskFlags,
  goals,
  journalEntries,
  badges,
}: AthleteDetailClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showWellnessModal, setShowWellnessModal] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState<WellnessCheckin | null>(null);
  const [deletingWellnessId, setDeletingWellnessId] = useState<string | null>(null);
  const [deletingWellness, setDeletingWellness] = useState(false);
  const [dismissedFlags, setDismissedFlags] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState(athlete.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const notesDirty = notes !== (athlete.notes || '');

  // Phase 4: Injury & Recovery state
  const [showAllInjuries, setShowAllInjuries] = useState(true);
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<string | null>(null);
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null);
  const [injuryTimelineFilter, setInjuryTimelineFilter] = useState<string>('all');

  // Phase 5: Goals, Journal, Badges state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [deletingGoal, setDeletingGoal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingJournalEntry, setEditingJournalEntry] = useState<JournalEntry | null>(null);
  const [deletingJournalId, setDeletingJournalId] = useState<string | null>(null);
  const [deletingJournal, setDeletingJournal] = useState(false);
  const [journalTagFilter, setJournalTagFilter] = useState<string>('all');
  const [journalSearch, setJournalSearch] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const visibleRiskFlags = riskFlags.filter((f) => !dismissedFlags.has(f.id));

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

  // Phase 4: Body map data (filtered by toggle)
  const bodyMapData = useMemo(() => {
    const filtered = showAllInjuries ? injuries : injuries.filter((i) => i.status !== 'resolved');
    const regionCounts: Record<string, number> = {};
    for (const inj of filtered) {
      if (inj.bodyRegion) {
        regionCounts[inj.bodyRegion] = (regionCounts[inj.bodyRegion] || 0) + 1;
      }
    }
    return Object.entries(regionCounts).map(([region, count]) => ({ region, count }));
  }, [injuries, showAllInjuries]);

  // Phase 4: Injuries for selected body region
  const regionInjuries = useMemo(() => {
    if (!selectedBodyRegion) return [];
    return injuries.filter((i) => {
      const region = i.bodyRegion?.toLowerCase() || '';
      const selected = selectedBodyRegion.toLowerCase().replace(/^back-/, '').replace(/-[lr]$/, '');
      return region.includes(selected) || selected.includes(region.split(' ')[0]?.toLowerCase() || '');
    });
  }, [injuries, selectedBodyRegion]);

  // Phase 4: Active / non-resolved injuries for Return-to-Play
  const activeInjuries = useMemo(
    () => injuries.filter((i) => i.status !== 'resolved'),
    [injuries]
  );

  // Phase 4: Unique body regions for timeline filter
  const injuryBodyRegions = useMemo(
    () => [...new Set(injuries.map((i) => i.bodyRegion).filter(Boolean))].sort(),
    [injuries]
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

  async function handleDeleteWellness() {
    if (!deletingWellnessId) return;
    setDeletingWellness(true);
    const result = await deleteWellnessAction(deletingWellnessId);
    if (result.success) {
      addToast('Wellness check-in deleted', 'success');
      router.refresh();
    } else {
      addToast(result.error || 'Failed to delete check-in', 'error');
    }
    setDeletingWellness(false);
    setDeletingWellnessId(null);
  }

  async function handleDeleteGoal() {
    if (!deletingGoalId) return;
    setDeletingGoal(true);
    const result = await deleteGoalAction(deletingGoalId);
    if (result.success) {
      addToast('Goal deleted', 'success');
      router.refresh();
    } else {
      addToast(result.error || 'Failed to delete goal', 'error');
    }
    setDeletingGoal(false);
    setDeletingGoalId(null);
  }

  async function handleMarkGoalAchieved(goalId: string) {
    const result = await markGoalAchievedAction(goalId);
    if (result.success) {
      addToast('Goal achieved! Congratulations!', 'success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      router.refresh();
    } else {
      addToast(result.error || 'Failed to update goal', 'error');
    }
  }

  async function handleDeleteJournal() {
    if (!deletingJournalId) return;
    setDeletingJournal(true);
    const result = await deleteJournalAction(deletingJournalId);
    if (result.success) {
      addToast('Journal entry deleted', 'success');
      router.refresh();
    } else {
      addToast(result.error || 'Failed to delete journal entry', 'error');
    }
    setDeletingJournal(false);
    setDeletingJournalId(null);
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
            {/* Risk Flags (3.4) */}
            {visibleRiskFlags.length > 0 && (
              <div className="space-y-2">
                {visibleRiskFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border-l-4 px-4 py-3',
                      flag.severity === 'danger'
                        ? 'border-danger bg-danger/5'
                        : 'border-warning bg-warning/5'
                    )}
                  >
                    <Shield
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        flag.severity === 'danger' ? 'text-danger' : 'text-warning'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          flag.severity === 'danger' ? 'text-danger' : 'text-warning'
                        )}
                      >
                        {flag.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{flag.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDismissedFlags((prev) => new Set([...prev, flag.id]))
                      }
                      className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <AthleteAnalytics
              metrics={metrics}
              performanceTrends={performanceTrends}
              loadTrends={loadTrends}
              riskIndicator={riskIndicator}
              avgRpeWeek={avgRpeWeek}
              totalDaysLost={totalDaysLost}
            />

            {/* Week-over-Week Comparison (3.2) */}
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">This Week vs Last Week</h3>
                {weekOverWeek.loadSpikeAlert && (
                  <Badge variant="danger" className="text-[10px]">
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                    Load Spike &gt;30%
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <WeeklyVolumeCard
                  label="Sessions"
                  current={weekOverWeek.currentWeek.sessions}
                  previous={weekOverWeek.previousWeek.sessions}
                  changePercent={weekOverWeek.changes.sessionsPercent}
                />
                <WeeklyVolumeCard
                  label="Total Load"
                  current={weekOverWeek.currentWeek.totalLoad}
                  previous={weekOverWeek.previousWeek.totalLoad}
                  changePercent={weekOverWeek.changes.loadPercent}
                  formatValue={(v) => v.toLocaleString()}
                />
                <WeeklyVolumeCard
                  label="Avg RPE"
                  current={weekOverWeek.currentWeek.avgRpe}
                  previous={weekOverWeek.previousWeek.avgRpe}
                  changePercent={weekOverWeek.changes.rpePercent}
                  invertColor
                />
                <WeeklyVolumeCard
                  label="Readiness"
                  current={weekOverWeek.currentWeek.avgReadiness ?? 0}
                  previous={weekOverWeek.previousWeek.avgReadiness ?? undefined}
                  changePercent={weekOverWeek.changes.readinessPercent}
                  formatValue={(v) => v > 0 ? String(v) : '—'}
                />
              </div>
            </Card>

            {/* Personal Records */}
            {personalRecords.length > 0 && (
              <CollapsibleCard
                title="Personal Records"
                badge={
                  personalRecords.some((pr) => pr.isRecent) ? (
                    <Badge variant="warning" className="text-[10px]">
                      <Trophy className="mr-1 inline h-3 w-3" />
                      NEW PR
                    </Badge>
                  ) : undefined
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-3 py-2 font-medium text-gray-500">Metric</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">PR Value</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">Date</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500" />
                      </tr>
                    </thead>
                    <tbody>
                      {personalRecords.map((pr) => (
                        <tr key={pr.metricId} className="border-b border-border last:border-0">
                          <td className="px-3 py-2.5 font-medium text-black">{pr.metricName}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-black">
                            {pr.prValue}
                            <span className="ml-1 text-xs text-gray-400">{pr.metricUnit}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-gray-500">
                            {new Date(pr.dateAchieved).toLocaleDateString('en-AU', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {pr.isRecent && (
                              <Badge variant="warning" className="text-[10px]">
                                <Trophy className="mr-1 inline h-3 w-3" />
                                NEW PR
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CollapsibleCard>
            )}

            {/* Radar Chart + Training Streak */}
            <CollapsibleCard title="Athlete Profile & Streaks">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Radar / Spider Chart */}
                {radarData.length >= 3 && (
                  <div>
                    <p className="mb-2 text-xs text-gray-400">Normalized 0-100 per metric</p>
                    <AnalyticsRadarChart
                      data={radarData}
                      athletes={[
                        { key: 'Current', name: 'Current', color: CHART_BLACK },
                        { key: '30 Days Ago', name: '30 Days Ago', color: CHART_GRAY },
                      ]}
                      height={280}
                    />
                  </div>
                )}

                {/* Training Streak Calendar */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-black">Training Activity</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-bold text-black">{trainingStreaks.currentStreak}</span>
                        <span className="text-xs text-gray-400">day streak</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Best: <span className="font-semibold text-black">{trainingStreaks.longestStreak}</span>
                      </div>
                    </div>
                  </div>
                  <CalendarHeatmap
                    data={dailyLoads.map((l) => ({
                      date: l.date.split('T')[0],
                      value: l.trainingLoad,
                    }))}
                  />
                </div>
              </div>
            </CollapsibleCard>

            {/* Activity Timeline */}
            <CollapsibleCard title="Activity Timeline" defaultOpen={false}>
              <ActivityTimeline
                dailyLoads={dailyLoads}
                testingSessions={testingSessions}
                injuries={injuries}
                onNavigate={(href) => router.push(href)}
              />
            </CollapsibleCard>

          </div>

          {/* Sidebar — 1 col */}
          <div className="mt-6 flex flex-col gap-6 lg:mt-0">
            {/* Bio & Details */}
            <Card className="order-3 lg:order-1">
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

            {/* Compliance Rate (3.3) */}
            <Card className="order-1 lg:order-2">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Compliance
              </h3>
              <div className="flex items-center gap-5">
                <ComplianceRing percent={compliance.weeklyPercent} size={72} />
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Weekly</span>
                      <span className={cn('font-semibold', compliance.weeklyPercent < 80 ? 'text-danger' : 'text-black')}>
                        {compliance.weeklyActual}/{compliance.weeklyTarget}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          compliance.weeklyPercent >= 80 ? 'bg-success' : compliance.weeklyPercent >= 50 ? 'bg-warning' : 'bg-danger'
                        )}
                        style={{ width: `${compliance.weeklyPercent}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Monthly</span>
                      <span className={cn('font-semibold', compliance.monthlyPercent < 80 ? 'text-danger' : 'text-black')}>
                        {compliance.monthlyActual}/{compliance.monthlyTarget}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          compliance.monthlyPercent >= 80 ? 'bg-success' : compliance.monthlyPercent >= 50 ? 'bg-warning' : 'bg-danger'
                        )}
                        style={{ width: `${compliance.monthlyPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Progress Sparklines */}
            {(loadTrends.length > 1 || wellnessCheckins.length > 1) && (
              <Card className="order-2 lg:order-3">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  30-Day Trends
                </h3>
                <div className="space-y-3">
                  {loadTrends.length > 1 && (
                    <SparklineRow
                      label="Training Load"
                      values={loadTrends.map((l) => l.trainingLoad)}
                      current={loadTrends[loadTrends.length - 1].trainingLoad}
                    />
                  )}
                  {loadTrends.length > 1 && (
                    <SparklineRow
                      label="RPE"
                      values={loadTrends.map((l) => l.rpe)}
                      current={loadTrends[loadTrends.length - 1].rpe}
                    />
                  )}
                  {wellnessCheckins.length > 1 && (
                    <SparklineRow
                      label="Readiness"
                      values={[...wellnessCheckins].reverse().map((w) => w.readinessScore)}
                      current={wellnessCheckins[0].readinessScore}
                      color={
                        wellnessCheckins[0].readinessScore >= 70
                          ? '#22c55e'
                          : wellnessCheckins[0].readinessScore >= 40
                            ? '#f59e0b'
                            : '#ef4444'
                      }
                    />
                  )}
                </div>
              </Card>
            )}

            {/* Achievement Badges (5.2) */}
            <CollapsibleCard
              title="Achievements"
              defaultOpen={false}
              badge={
                badges.filter((b) => b.earned).length > 0 ? (
                  <span className="text-xs font-medium text-amber-600">
                    {badges.filter((b) => b.earned).length}/{badges.length}
                  </span>
                ) : undefined
              }
              className="order-4 lg:order-4"
            >
              <div className="space-y-2">
                {badges.map((badge) => (
                  <BadgeShelfItem key={badge.id} badge={badge} />
                ))}
              </div>
            </CollapsibleCard>

            {/* Notes */}
            <Card className="order-5 lg:order-5">
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

          {/* Training Load Zones (3.1) */}
          {loadZones.days.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-black">Training Load Zones</h3>
                  <p className="text-xs text-gray-400">Based on rolling average ± standard deviation</p>
                </div>
                {loadZones.dangerStreak >= 2 && (
                  <Badge variant="danger" className="text-[10px]">
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                    {loadZones.dangerStreak}d in Danger Zone
                  </Badge>
                )}
              </div>
              <LoadZoneChart days={loadZones.days} />
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-200" /> Rest</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-300" /> Low</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Optimal</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" /> High</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" /> Danger</span>
              </div>
            </Card>
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

      {/* ─── Injuries Tab (Phase 4 Enhanced) ──────────────────── */}
      {activeTab === 'injuries' && (
        <div className="space-y-6">
          {/* Injury Summary Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

          {/* 4.1 — Body Map + Injury Details */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">Injury Body Map</h3>
              <div className="flex items-center gap-3">
                {activeInjuryCount > 0 && (
                  <Badge variant="danger">{activeInjuryCount} active</Badge>
                )}
                <button
                  type="button"
                  onClick={() => { setShowAllInjuries(!showAllInjuries); setSelectedBodyRegion(null); }}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {showAllInjuries ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {showAllInjuries ? 'All Injuries' : 'Active Only'}
                </button>
              </div>
            </div>

            {injuries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <HeartPulse className="mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">No injuries recorded</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
                {/* Body Map */}
                <div className="flex justify-center">
                  <BodyMap
                    data={bodyMapData}
                    selectedRegion={selectedBodyRegion}
                    onRegionClick={(region) =>
                      setSelectedBodyRegion(selectedBodyRegion === region ? null : region)
                    }
                  />
                </div>

                {/* Injury detail panel */}
                <div className="min-w-0">
                  {selectedBodyRegion && regionInjuries.length > 0 ? (
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-black">
                        {selectedBodyRegion.replace(/^back-/, '').replace(/-[lr]$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Injuries
                      </h4>
                      <div className="space-y-2">
                        {regionInjuries.map((inj) => (
                          <button
                            key={inj.id}
                            type="button"
                            onClick={() => setSelectedInjury(selectedInjury?.id === inj.id ? null : inj)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all',
                              selectedInjury?.id === inj.id ? 'border-black bg-gray-50 shadow-sm' : 'border-border hover:bg-gray-50',
                              inj.status === 'active' && 'border-l-[3px] border-l-red-500',
                              (inj.status === 'rehab' || inj.status === 'monitoring') && 'border-l-[3px] border-l-amber-500',
                              inj.status === 'resolved' && 'border-l-[3px] border-l-emerald-500',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <InjuryStatusBadge status={inj.status} />
                              <div className="text-left">
                                <span className="font-medium text-black">{inj.bodyRegion}</span>
                                {inj.type && <span className="ml-2 text-gray-500">({inj.type})</span>}
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              {new Date(inj.dateOccurred).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Expanded injury detail */}
                      {selectedInjury && (
                        <div className="mt-3 rounded-lg border border-border bg-gray-50 p-4 text-sm">
                          <div className="mb-2 flex items-center justify-between">
                            <h5 className="font-semibold text-black">{selectedInjury.bodyRegion} — {selectedInjury.type || 'Injury'}</h5>
                            <button
                              type="button"
                              onClick={() => router.push(`/injuries/${selectedInjury.id}`)}
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              View Full Detail
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize text-black">{selectedInjury.status}</span></div>
                            <div><span className="text-gray-500">Mechanism:</span> <span className="font-medium text-black">{selectedInjury.mechanism || '—'}</span></div>
                            <div><span className="text-gray-500">Date Occurred:</span> <span className="font-medium text-black">{new Date(selectedInjury.dateOccurred).toLocaleDateString('en-AU')}</span></div>
                            <div><span className="text-gray-500">Days Lost:</span> <span className="font-medium text-black">{selectedInjury.daysLost ?? 0}</span></div>
                            {selectedInjury.dateResolved && (
                              <div><span className="text-gray-500">Resolved:</span> <span className="font-medium text-black">{new Date(selectedInjury.dateResolved).toLocaleDateString('en-AU')}</span></div>
                            )}
                            {selectedInjury.description && (
                              <div className="col-span-2"><span className="text-gray-500">Description:</span> <span className="font-medium text-black">{selectedInjury.description}</span></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedBodyRegion ? (
                    <div className="flex h-full items-center justify-center py-8">
                      <p className="text-sm text-gray-400">No injuries in this region</p>
                    </div>
                  ) : (
                    /* Default: show full injury list */
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-black">
                        {showAllInjuries ? 'All' : 'Active'} Injuries ({(showAllInjuries ? injuries : injuries.filter((i) => i.status !== 'resolved')).length})
                      </h4>
                      <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                        {(showAllInjuries ? injuries : injuries.filter((i) => i.status !== 'resolved')).map((inj) => (
                          <button
                            key={inj.id}
                            type="button"
                            onClick={() => router.push(`/injuries/${inj.id}`)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-all hover:shadow-sm',
                              inj.status === 'active' && 'border-l-[3px] border-l-red-500 hover:bg-red-50/50',
                              (inj.status === 'rehab' || inj.status === 'monitoring') && 'border-l-[3px] border-l-amber-500 hover:bg-amber-50/50',
                              inj.status === 'resolved' && 'border-l-[3px] border-l-emerald-500 hover:bg-emerald-50/50',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <InjuryStatusBadge status={inj.status} />
                              <div className="text-left">
                                <span className="font-medium text-black">{inj.bodyRegion}</span>
                                {inj.type && <span className="ml-2 text-gray-500">({inj.type})</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-500">
                                {new Date(inj.dateOccurred).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              {inj.daysLost != null && inj.daysLost > 0 && (
                                <p className="text-xs text-gray-400">{inj.daysLost}d lost</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status legend */}
            {injuries.length > 0 && (
              <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-[10px] text-gray-500">
                <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-red-500" /> Active</div>
                <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Rehab / Monitoring</div>
                <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Resolved</div>
              </div>
            )}
          </Card>

          {/* 4.2 — Return-to-Play Progress Tracker */}
          {activeInjuries.length > 0 && (
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-black">Return-to-Play Progress</h3>
              <div className="space-y-4">
                {activeInjuries.map((inj) => (
                  <ReturnToPlayCard key={inj.id} injury={inj} onViewDetail={() => router.push(`/injuries/${inj.id}`)} />
                ))}
              </div>
            </Card>
          )}

          {/* 4.3 — Injury Timeline */}
          {injuries.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Injury Timeline</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={injuryTimelineFilter}
                    onChange={(e) => setInjuryTimelineFilter(e.target.value)}
                    className="rounded-md border border-border px-2 py-1 text-xs text-gray-700 focus:border-black focus:outline-none"
                  >
                    <option value="all">All Regions</option>
                    {injuryBodyRegions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <InjuryTimeline
                injuries={injuryTimelineFilter === 'all' ? injuries : injuries.filter((i) => i.bodyRegion === injuryTimelineFilter)}
              />
            </Card>
          )}
        </div>
      )}

      {/* ─── Wellness Tab ─────────────────────────────────────── */}
      {activeTab === 'wellness' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">Wellness Check-ins</h3>
            <Button
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditingCheckin(null);
                setShowWellnessModal(true);
              }}
            >
              Add Check-in
            </Button>
          </div>
          {wellnessCheckins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Sun className="mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">No wellness check-ins recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {wellnessCheckins.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-all hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        w.readinessScore >= 70
                          ? 'success'
                          : w.readinessScore >= 40
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {w.readinessScore}%
                    </Badge>
                    <div>
                      <span className="font-medium text-black">
                        {new Date(w.date).toLocaleDateString('en-AU', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        <span>{w.sleepHours}h sleep</span>
                        <span className="text-gray-300">|</span>
                        <span>SQ:{w.sleepQuality}</span>
                        <span>So:{w.soreness}</span>
                        <span>Fa:{w.fatigue}</span>
                        <span>Mo:{w.mood}</span>
                        <span>Hy:{w.hydration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCheckin(w);
                        setShowWellnessModal(true);
                      }}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
                      title="Edit check-in"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingWellnessId(w.id)}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Delete check-in"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── Goals Tab (5.1) ──────────────────────────────────── */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Confetti overlay */}
          {showConfetti && (
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
              <div className="animate-bounce text-6xl">🎉</div>
            </div>
          )}

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">Performance Goals</h3>
              <Button
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
              >
                Set Goal
              </Button>
            </div>

            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Target className="mb-2 h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">No goals set yet</p>
                <p className="mt-1 text-xs text-gray-400">Set targets for specific metrics to track progress</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Goals */}
                {goals.filter((g) => g.status === 'active').length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Active Goals</h4>
                    <div className="space-y-3">
                      {goals.filter((g) => g.status === 'active').map((goal) => {
                        const pr = personalRecords.find((p) => p.metricId === goal.metricId);
                        const currentBest = pr?.prValue ?? goal.currentBest ?? 0;
                        const progress = goal.direction === 'higher'
                          ? Math.min((currentBest / goal.targetValue) * 100, 100)
                          : currentBest > 0 ? Math.min((goal.targetValue / currentBest) * 100, 100) : 0;
                        const isAchieved = goal.direction === 'higher'
                          ? currentBest >= goal.targetValue
                          : currentBest <= goal.targetValue && currentBest > 0;
                        const isExpired = goal.deadline && new Date(goal.deadline) < new Date();
                        const metric = metrics.find((m) => m.id === goal.metricId);
                        const unit = metric?.unit || '';

                        return (
                          <div key={goal.id} className="rounded-lg border border-border p-4">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-black">{goal.metricName}</span>
                                {isExpired && !isAchieved && <Badge variant="warning">Overdue</Badge>}
                              </div>
                              <div className="flex items-center gap-1">
                                {isAchieved && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkGoalAchieved(goal.id)}
                                    className="rounded p-1.5 text-emerald-500 transition-colors hover:bg-emerald-50"
                                    title="Mark as achieved"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
                                  title="Edit goal"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingGoalId(goal.id)}
                                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                  title="Delete goal"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-2 flex items-center gap-3">
                              <div className="flex-1">
                                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all',
                                      isAchieved ? 'bg-emerald-500' : progress > 75 ? 'bg-blue-500' : progress > 50 ? 'bg-amber-500' : 'bg-gray-400'
                                    )}
                                    style={{ width: `${Math.round(progress)}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-black">{Math.round(progress)}%</span>
                            </div>

                            {/* Details */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span>Current: <span className="font-medium text-black">{currentBest}{unit ? ` ${unit}` : ''}</span></span>
                              <span>Target: <span className="font-medium text-black">{goal.targetValue}{unit ? ` ${unit}` : ''}</span></span>
                              <span>Direction: {goal.direction === 'higher' ? '↑ Higher' : '↓ Lower'}</span>
                              {goal.deadline && (
                                <span>Deadline: <span className="font-medium text-black">{new Date(goal.deadline).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Achieved Goals */}
                {goals.filter((g) => g.status === 'achieved').length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Achieved</h4>
                    <div className="space-y-2">
                      {goals.filter((g) => g.status === 'achieved').map((goal) => (
                        <div key={goal.id} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium text-black">{goal.metricName}</span>
                            <Badge variant="success">Achieved</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Target: {goal.targetValue}</span>
                            {goal.achievedDate && (
                              <span>{new Date(goal.achievedDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeletingGoalId(goal.id)}
                              className="rounded p-1 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── Journal Tab (5.3) ─────────────────────────────────── */}
      {activeTab === 'journal' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">Training Journal</h3>
            <Button
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => { setEditingJournalEntry(null); setShowJournalModal(true); }}
            >
              New Entry
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                placeholder="Search entries..."
                className="w-full rounded-md border border-border bg-white py-1.5 pl-8 pr-3 text-sm text-black placeholder-gray-400 focus:border-black focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setJournalTagFilter('all')}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  journalTagFilter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                All
              </button>
              {['technique', 'mindset', 'nutrition', 'recovery', 'general'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setJournalTagFilter(journalTagFilter === tag ? 'all' : tag)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                    journalTagFilter === tag ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {journalEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpenText className="mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">No journal entries yet</p>
              <p className="mt-1 text-xs text-gray-400">Record your training thoughts, insights, and reflections</p>
            </div>
          ) : (
            <div className="space-y-3">
              {journalEntries
                .filter((e) => journalTagFilter === 'all' || e.tags.includes(journalTagFilter))
                .filter((e) => !journalSearch || e.content.toLowerCase().includes(journalSearch.toLowerCase()))
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-border p-4 transition-all hover:bg-gray-50"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-black">
                          {new Date(entry.date).toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                          >
                            <Hash className="h-2.5 w-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditingJournalEntry(entry); setShowJournalModal(true); }}
                          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
                          title="Edit entry"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingJournalId(entry.id)}
                          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {entry.content}
                    </p>
                  </div>
                ))}
              {journalEntries
                .filter((e) => journalTagFilter === 'all' || e.tags.includes(journalTagFilter))
                .filter((e) => !journalSearch || e.content.toLowerCase().includes(journalSearch.toLowerCase()))
                .length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">No entries match your filters</p>
              )}
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

      <Modal
        isOpen={showWellnessModal}
        onClose={() => {
          setShowWellnessModal(false);
          setEditingCheckin(null);
        }}
        title={editingCheckin ? 'Edit Wellness Check-in' : 'Add Wellness Check-in'}
      >
        <WellnessForm
          checkin={editingCheckin ?? undefined}
          athleteId={athlete.id}
          onSuccess={() => {
            setShowWellnessModal(false);
            setEditingCheckin(null);
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!deletingWellnessId}
        onClose={() => setDeletingWellnessId(null)}
        onConfirm={handleDeleteWellness}
        title="Delete Wellness Check-in"
        message="Are you sure you want to delete this wellness check-in? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deletingWellness}
      />

      <Modal
        isOpen={showGoalModal}
        onClose={() => { setShowGoalModal(false); setEditingGoal(null); }}
        title={editingGoal ? 'Edit Goal' : 'Set a New Goal'}
      >
        <GoalForm
          goal={editingGoal ?? undefined}
          athleteId={athlete.id}
          metrics={metrics}
          onSuccess={() => { setShowGoalModal(false); setEditingGoal(null); }}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!deletingGoalId}
        onClose={() => setDeletingGoalId(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deletingGoal}
      />

      <Modal
        isOpen={showJournalModal}
        onClose={() => { setShowJournalModal(false); setEditingJournalEntry(null); }}
        title={editingJournalEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
      >
        <JournalForm
          entry={editingJournalEntry ?? undefined}
          athleteId={athlete.id}
          onSuccess={() => { setShowJournalModal(false); setEditingJournalEntry(null); }}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!deletingJournalId}
        onClose={() => setDeletingJournalId(null)}
        onConfirm={handleDeleteJournal}
        title="Delete Journal Entry"
        message="Are you sure you want to delete this journal entry? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deletingJournal}
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

function SparklineRow({
  label,
  values,
  current,
  color = '#000',
}: {
  label: string;
  values: number[];
  current: number;
  color?: string;
}) {
  const w = 80;
  const h = 24;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-black">{current}</p>
      </div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          opacity={0.5}
        />
        {values.length > 0 && (
          <circle
            cx={pad + ((values.length - 1) / Math.max(values.length - 1, 1)) * (w - pad * 2)}
            cy={h - pad - ((values[values.length - 1] - min) / range) * (h - pad * 2)}
            r={2.5}
            fill={color}
          />
        )}
      </svg>
    </div>
  );
}

function WeeklyVolumeCard({
  label,
  current,
  previous,
  changePercent,
  formatValue,
  invertColor,
}: {
  label: string;
  current: number;
  previous?: number;
  changePercent: number | null;
  formatValue?: (v: number) => string;
  invertColor?: boolean;
}) {
  const display = formatValue ? formatValue(current) : String(current);
  const prevDisplay = previous != null ? (formatValue ? formatValue(previous) : String(previous)) : null;

  let changeColor = 'text-gray-400';
  let ChangeIcon: typeof TrendingUp | typeof Minus = Minus;

  if (changePercent !== null && changePercent !== 0) {
    const isPositive = changePercent > 0;
    ChangeIcon = isPositive ? TrendingUp : TrendingDown;
    if (invertColor) {
      changeColor = isPositive ? 'text-red-500' : 'text-emerald-500';
    } else {
      changeColor = isPositive ? 'text-emerald-500' : 'text-red-500';
    }
  }

  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-black">{display}</p>
      {prevDisplay != null && (
        <p className="text-[10px] text-gray-400">was {prevDisplay}</p>
      )}
      <div className={cn('mt-1 flex items-center justify-center gap-1 text-[10px] font-medium', changeColor)}>
        <ChangeIcon className="h-3 w-3" />
        {changePercent !== null ? (
          <span>{changePercent > 0 ? '+' : ''}{changePercent}%</span>
        ) : (
          <span>—</span>
        )}
      </div>
    </div>
  );
}

function LoadZoneChart({ days }: { days: { date: string; trainingLoad: number; zone: string }[] }) {
  const maxLoad = Math.max(...days.map((d) => d.trainingLoad), 1);

  const zoneColor: Record<string, string> = {
    rest: 'bg-gray-200',
    low: 'bg-blue-300',
    optimal: 'bg-emerald-400',
    high: 'bg-amber-400',
    danger: 'bg-red-500',
  };

  return (
    <div className="flex items-end gap-[2px]" style={{ height: 80 }}>
      {days.map((d) => {
        const h = d.trainingLoad > 0 ? Math.max(4, (d.trainingLoad / maxLoad) * 72) : 4;
        return (
          <div
            key={d.date}
            className={cn('flex-1 rounded-t-sm transition-all', zoneColor[d.zone] || 'bg-gray-200')}
            style={{ height: `${h}px` }}
            title={`${d.date}: ${d.trainingLoad} (${d.zone})`}
          />
        );
      })}
    </div>
  );
}

function ComplianceRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  const color =
    percent >= 80 ? '#22c55e' : percent >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-black">{percent}%</span>
      </div>
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

// ── Phase 4 Subcomponents ───────────────────────────────────────────

function InjuryStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'danger' | 'warning' | 'success' | 'default'; label: string }> = {
    active: { variant: 'danger', label: 'Active' },
    rehab: { variant: 'warning', label: 'Rehab' },
    monitoring: { variant: 'warning', label: 'Monitoring' },
    resolved: { variant: 'success', label: 'Resolved' },
  };
  const c = config[status] || { variant: 'default' as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

const RTP_MILESTONES = [
  { key: 'active', label: 'Injury Reported', description: 'Initial assessment & treatment plan' },
  { key: 'rehab', label: 'Rehabilitation', description: 'Pain-free ROM & progressive loading' },
  { key: 'monitoring', label: 'Return to Training', description: 'Modified training & monitoring' },
  { key: 'resolved', label: 'Full Clearance', description: 'Cleared for full participation' },
] as const;

function ReturnToPlayCard({ injury, onViewDetail }: { injury: Injury; onViewDetail: () => void }) {
  const statusIndex = RTP_MILESTONES.findIndex((m) => m.key === injury.status);
  const progressPercent = statusIndex >= 0 ? Math.round(((statusIndex + 1) / RTP_MILESTONES.length) * 100) : 25;

  // Estimate days in current phase
  const daysSinceOccurred = Math.floor(
    (Date.now() - new Date(injury.dateOccurred).getTime()) / 86400000
  );

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InjuryStatusBadge status={injury.status} />
          <span className="font-medium text-black">{injury.bodyRegion}</span>
          {injury.type && <span className="text-sm text-gray-500">({injury.type})</span>}
        </div>
        <button
          type="button"
          onClick={onViewDetail}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Details
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            progressPercent <= 25 ? 'bg-red-500' : progressPercent <= 50 ? 'bg-amber-500' : progressPercent <= 75 ? 'bg-blue-500' : 'bg-emerald-500'
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Milestones */}
      <div className="mt-3 grid grid-cols-4 gap-1">
        {RTP_MILESTONES.map((milestone, idx) => {
          const isCompleted = idx < statusIndex;
          const isCurrent = idx === statusIndex;
          return (
            <div key={milestone.key} className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-white',
                  isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-black' : 'bg-gray-200'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isCurrent ? (
                  <Circle className="h-3 w-3 fill-white" />
                ) : (
                  <Circle className="h-3 w-3 text-gray-400" />
                )}
              </div>
              <span className={cn('text-[10px] leading-tight', isCurrent ? 'font-semibold text-black' : 'text-gray-500')}>
                {milestone.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Time info */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>{daysSinceOccurred} days since injury</span>
        {injury.daysLost != null && injury.daysLost > 0 && <span>{injury.daysLost} days lost</span>}
      </div>
    </div>
  );
}

function InjuryTimeline({ injuries }: { injuries: Injury[] }) {
  if (injuries.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">No injuries to display</p>;
  }

  // Sort by dateOccurred ascending
  const sorted = [...injuries].sort(
    (a, b) => new Date(a.dateOccurred).getTime() - new Date(b.dateOccurred).getTime()
  );

  // Determine timeline bounds
  const earliest = new Date(sorted[0].dateOccurred).getTime();
  const latestDate = sorted.reduce((max, i) => {
    const resolved = i.dateResolved ? new Date(i.dateResolved).getTime() : Date.now();
    return Math.max(max, resolved);
  }, earliest);
  const range = Math.max(latestDate - earliest, 86400000); // at least 1 day

  const statusColor: Record<string, string> = {
    active: '#ef4444',
    rehab: '#f59e0b',
    monitoring: '#f59e0b',
    resolved: '#22c55e',
  };

  return (
    <div className="space-y-3">
      {sorted.map((inj) => {
        const start = new Date(inj.dateOccurred).getTime();
        const end = inj.dateResolved ? new Date(inj.dateResolved).getTime() : Date.now();
        const leftPercent = ((start - earliest) / range) * 100;
        const widthPercent = Math.max(((end - start) / range) * 100, 1);
        const color = statusColor[inj.status] || '#9ca3af';
        const duration = Math.ceil((end - start) / 86400000);

        return (
          <div key={inj.id} className="group">
            <div className="mb-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-black">{inj.bodyRegion}</span>
                {inj.type && <span className="text-gray-500">({inj.type})</span>}
                <InjuryStatusBadge status={inj.status} />
              </div>
              <span className="text-gray-500">
                {new Date(inj.dateOccurred).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' })}
                {' → '}
                {inj.dateResolved
                  ? new Date(inj.dateResolved).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' })
                  : 'Ongoing'}
                {' · '}
                {duration}d
              </span>
            </div>
            <div className="relative h-5 w-full rounded-full bg-gray-100">
              <div
                className="absolute top-0 h-full rounded-full opacity-80 transition-opacity group-hover:opacity-100"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  backgroundColor: color,
                  minWidth: '4px',
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Time axis labels */}
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span>{new Date(earliest).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })}</span>
        <span>{new Date(latestDate).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })}</span>
      </div>
    </div>
  );
}

// ── Phase 5 Subcomponents ───────────────────────────────────────────

const BADGE_ICONS: Record<string, React.ReactNode> = {
  flame: <Flame className="h-4 w-4" />,
  trophy: <Trophy className="h-4 w-4" />,
  heart: <Heart className="h-4 w-4" />,
  target: <Target className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
};

function BadgeShelfItem({ badge }: { badge: AchievementBadge }) {
  const progressPercent = badge.target > 0 ? Math.round((badge.progress / badge.target) * 100) : 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-2.5 transition-all',
        badge.earned
          ? 'border-amber-200 bg-amber-50/50'
          : 'border-border bg-white opacity-60'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          badge.earned ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
        )}
      >
        {BADGE_ICONS[badge.icon] || <Award className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-xs font-semibold', badge.earned ? 'text-black' : 'text-gray-500')}>
            {badge.name}
          </span>
          {badge.earned && <span className="text-xs">✓</span>}
        </div>
        {!badge.earned && (
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gray-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{badge.progress}/{badge.target}</span>
          </div>
        )}
      </div>
    </div>
  );
}
