'use client';

import { useState, useMemo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AnalyticsLineChart } from '@/components/charts/LineChart';
import { AnalyticsAreaChart } from '@/components/charts/AreaChart';
import { AnalyticsRadarChart } from '@/components/charts/RadarChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { BodyMap } from '@/components/charts/BodyMap';
import { MetricSlicer } from '@/components/dashboard/MetricSlicer';
import { CHART_BLACK, CHART_GRAY } from '@/components/charts/chartColors';
import { cn } from '@/utils/cn';
import {
  Share2,
  Trophy,
  Zap,
  HeartPulse,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Dumbbell,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  User,
  BookOpen,
  Shield,
  Copy,
  Check,
  Flame,
  Target,
  Heart,
  CheckCircle2,
  Clock,
  Moon,
  Droplets,
  Frown,
  Smile,
  Meh,
} from 'lucide-react';
import type {
  Athlete,
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
  AchievementBadge,
} from '@/types';
import type { ComplianceRate } from '@/lib/services/analyticsService';

const PROFILE_TABS = [
  { key: 'overview' as const, label: 'Overview', shortLabel: 'Overview', icon: <Activity className="h-3.5 w-3.5" /> },
  { key: 'training' as const, label: 'Training', shortLabel: 'Training', icon: <Dumbbell className="h-3.5 w-3.5" /> },
  { key: 'wellness' as const, label: 'Wellness', shortLabel: 'Wellness', icon: <HeartPulse className="h-3.5 w-3.5" /> },
  { key: 'injuries' as const, label: 'Injuries', shortLabel: 'Injuries', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { key: 'goals' as const, label: 'Goals & Badges', shortLabel: 'Goals', icon: <Trophy className="h-3.5 w-3.5" /> },
];

interface PublicProfileClientProps {
  athlete: Athlete;
  injuries: Injury[];
  dailyLoads: DailyLoad[];
  testingSessions: TestingSession[];
  metrics: Metric[];
  performanceTrends: PerformanceTrend[];
  loadTrends: LoadTrend[];
  riskIndicator: RiskIndicator | null;
  avgRpeWeek: number;
  totalDaysLost: number;
  latestWellness: WellnessCheckin | null;
  wellnessTrend: WellnessCheckin[];
  personalRecords: PersonalRecord[];
  weeklyVolume: WeeklyVolumeSummary;
  radarData: { metric: string; Current: number; '30 Days Ago': number }[];
  trainingStreaks: { currentStreak: number; longestStreak: number };
  compliance: ComplianceRate;
  badges: AchievementBadge[];
  goals: Goal[];
  wellnessCheckins: WellnessCheckin[];
}

export function PublicProfileClient({
  athlete,
  injuries,
  dailyLoads,
  testingSessions,
  metrics,
  performanceTrends,
  loadTrends,
  riskIndicator,
  avgRpeWeek,
  totalDaysLost,
  latestWellness,
  wellnessTrend,
  personalRecords,
  weeklyVolume,
  radarData,
  trainingStreaks,
  compliance,
  badges,
  goals,
  wellnessCheckins,
}: PublicProfileClientProps) {
  const [copied, setCopied] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState(metrics[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'training' | 'wellness' | 'injuries' | 'goals'>('overview');

  // ── Computed ───────────────────────────────────────────────────
  const riskLevel = riskIndicator?.riskLevel || 'low';

  const age = athlete.dateOfBirth
    ? Math.floor((Date.now() - new Date(athlete.dateOfBirth).getTime()) / (365.25 * 86400000))
    : null;

  const activeInjuryCount = injuries.filter((i) => i.status !== 'resolved').length;

  const daysSinceLastInjury = useMemo(() => {
    const sorted = injuries
      .filter((i) => i.dateOccurred)
      .sort((a, b) => new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime());
    if (sorted.length === 0) return null;
    return Math.floor((Date.now() - new Date(sorted[0].dateOccurred).getTime()) / 86400000);
  }, [injuries]);

  const metricTrends = performanceTrends
    .filter((t) => t.metricName === selectedMetricId)
    .map((t) => ({
      date: new Date(t.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
      'Best Score': t.bestScore,
      Average: t.averageScore,
    }));

  const selectedMetric = metrics.find((m) => m.id === selectedMetricId);
  const latestBestScore = metricTrends.length > 0 ? metricTrends[metricTrends.length - 1]['Best Score'] : null;

  const loadChartData = loadTrends.map((l) => ({
    date: new Date(l.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
    'Training Load': l.trainingLoad,
  }));

  // Heatmap data
  const heatmapData = useMemo(
    () => dailyLoads.map((l) => ({ date: l.date.split('T')[0], value: l.trainingLoad })),
    [dailyLoads]
  );

  // Body map data
  const bodyMapData = useMemo(() => {
    const regionMap = new Map<string, number>();
    for (const inj of injuries) {
      const region = inj.bodyRegion || 'Unknown';
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    }
    return Array.from(regionMap.entries()).map(([region, count]) => ({ region, count }));
  }, [injuries]);

  // Active injuries for return-to-play
  const activeInjuries = useMemo(
    () => injuries.filter((i) => i.status !== 'resolved'),
    [injuries]
  );

  // Wellness breakdown (last 7 check-ins)
  const wellnessBreakdown = useMemo(() => {
    const recent = wellnessCheckins.slice(0, 7);
    if (recent.length === 0) return null;
    const avg = (key: keyof WellnessCheckin) => {
      const vals = recent.map((w) => Number(w[key])).filter((v) => !isNaN(v));
      return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    };
    return {
      sleepHours: avg('sleepHours'),
      sleepQuality: avg('sleepQuality'),
      soreness: avg('soreness'),
      fatigue: avg('fatigue'),
      mood: avg('mood'),
      hydration: avg('hydration'),
      count: recent.length,
    };
  }, [wellnessCheckins]);

  // 30-day sparkline data
  const loadSparkline = useMemo(
    () => loadTrends.map((l) => l.trainingLoad),
    [loadTrends]
  );
  const rpeSparkline = useMemo(
    () => loadTrends.map((l) => l.rpe),
    [loadTrends]
  );
  const readinessSparkline = useMemo(
    () =>
      wellnessCheckins
        .slice(0, 30)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((w) => w.readinessScore),
    [wellnessCheckins]
  );

  // Goals split
  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active'), [goals]);
  const achievedGoals = useMemo(() => goals.filter((g) => g.status === 'achieved'), [goals]);

  const infoLine = [athlete.sportName, athlete.position, age != null ? `${age} years old` : null]
    .filter(Boolean)
    .join(' \u00B7 ');

  const riskRingColor =
    riskLevel === 'high'
      ? 'from-red-400 to-red-600'
      : riskLevel === 'moderate'
        ? 'from-amber-400 to-amber-600'
        : 'from-emerald-400 to-emerald-600';

  const accentColor =
    riskLevel === 'high' ? 'text-red-400' : riskLevel === 'moderate' ? 'text-amber-400' : 'text-emerald-400';

  const trajectoryIcon =
    riskIndicator?.trajectory === 'worsening' ? (
      <TrendingUp className="h-3.5 w-3.5 text-red-400" />
    ) : riskIndicator?.trajectory === 'improving' ? (
      <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
    ) : (
      <Minus className="h-3 w-3 text-white/30" />
    );

  // ── Handlers ───────────────────────────────────────────────────
  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Timeline events ────────────────────────────────────────────
  const timelineEvents = useMemo(() => {
    type Evt = { id: string; date: string; type: 'load' | 'test' | 'injury'; label: string; detail: string };
    const events: Evt[] = [
      ...dailyLoads.slice(0, 20).map((l) => ({
        id: `l-${l.id}`,
        date: l.date,
        type: 'load' as const,
        label: `${l.sessionType} session`,
        detail: `Load ${l.trainingLoad} · RPE ${l.rpe}`,
      })),
      ...testingSessions.slice(0, 10).map((s) => ({
        id: `t-${s.id}`,
        date: s.date,
        type: 'test' as const,
        label: 'Testing session',
        detail: s.notes || 'Performance testing',
      })),
      ...injuries.map((i) => ({
        id: `i-${i.id}`,
        date: i.dateOccurred,
        type: 'injury' as const,
        label: `${i.bodyRegion} ${i.type || 'injury'}`,
        detail: i.status !== 'resolved' ? 'Active' : `Resolved · ${i.daysLost ?? 0}d lost`,
      })),
    ];
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events.slice(0, 6);
  }, [dailyLoads, testingSessions, injuries]);

  const typeIcon = {
    load: <Dumbbell className="h-3.5 w-3.5" />,
    test: <ClipboardCheck className="h-3.5 w-3.5" />,
    injury: <AlertTriangle className="h-3.5 w-3.5" />,
  };
  const typeDot = {
    load: 'bg-white/20 text-white/70',
    test: 'bg-blue-500/20 text-blue-400',
    injury: 'bg-red-500/20 text-red-400',
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950">
      {/* ── Floating Top Bar ─────────────────────────────────── */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white">DJP</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Athlete
            </span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-16 pt-20 sm:pb-20 sm:pt-28">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              'h-[300px] w-[300px] rounded-full opacity-[0.07] blur-[80px] sm:h-[500px] sm:w-[500px] sm:blur-[120px]',
              riskLevel === 'high' ? 'bg-red-500' : riskLevel === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
            )}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          {/* Avatar */}
          <div className="mx-auto w-fit">
            <div className={cn('rounded-full bg-gradient-to-br p-[3px]', riskRingColor)}>
              <div className="rounded-full bg-gray-950 p-[3px]">
                <Avatar
                  src={athlete.photo?.thumbnails?.large?.url ?? athlete.photo?.url}
                  name={athlete.name}
                  size="lg"
                  className="!h-20 !w-20 text-3xl sm:!h-28 sm:!w-28 sm:text-4xl"
                />
              </div>
            </div>
          </div>

          {/* Name */}
          <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {athlete.name}
          </h1>

          {/* Meta */}
          <p className="mt-3 text-base text-white/40 sm:text-lg">
            {infoLine || 'Athlete'}
          </p>
          {athlete.programName && (
            <p className="mt-1 text-sm text-white/20">{athlete.programName}</p>
          )}

          {/* Status badges */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                athlete.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                  : 'bg-white/5 text-white/40 ring-1 ring-white/10'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', athlete.status === 'active' ? 'bg-emerald-400' : 'bg-gray-500')} />
              {athlete.status === 'active' ? 'Active' : 'Inactive'}
            </span>
            {riskIndicator && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                  riskLevel === 'high'
                    ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                    : riskLevel === 'moderate'
                      ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                )}
              >
                <Shield className="h-3 w-3" />
                {riskLevel} risk
              </span>
            )}
          </div>

          {/* ── Readiness Gauge Banner ────────────────────────── */}
          {latestWellness && (
            <div className="mx-auto mt-8 max-w-md">
              <div className="flex items-center justify-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 backdrop-blur-xl sm:gap-6 sm:px-6">
                <ReadinessGauge score={latestWellness.readinessScore} />
                <div className="text-left">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/30">
                    Today&apos;s Readiness
                  </p>
                  <p className="mt-0.5 text-xs text-white/20">
                    {new Date(latestWellness.date).toLocaleDateString('en-AU', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {wellnessTrend.length >= 2 && (
                    <div className="mt-2">
                      <ReadinessSparkline data={wellnessTrend.map((w) => w.readinessScore)} />
                      <p className="mt-0.5 text-[10px] text-white/20">7-day trend</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Glass Stat Cards ─────────────────────────────── */}
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <GlassCard
              value={riskIndicator?.acwr ?? '—'}
              label="ACWR"
              icon={<Activity className="h-4 w-4" />}
              valueClassName={accentColor}
              extra={riskIndicator ? trajectoryIcon : undefined}
            />
            <GlassCard
              value={avgRpeWeek || '—'}
              label="Avg RPE (7d)"
              icon={<Zap className="h-4 w-4" />}
              valueClassName={
                avgRpeWeek <= 3 ? 'text-emerald-400' : avgRpeWeek <= 6 ? 'text-amber-400' : 'text-red-400'
              }
            />
            <GlassCard
              value={totalDaysLost}
              label="Days Lost"
              icon={<HeartPulse className="h-4 w-4" />}
              valueClassName={totalDaysLost > 0 ? 'text-red-400' : 'text-white'}
            />
            <GlassCard
              value={daysSinceLastInjury != null ? daysSinceLastInjury : '—'}
              label="Injury-Free"
              icon={<Calendar className="h-4 w-4" />}
              valueClassName={daysSinceLastInjury != null && daysSinceLastInjury > 30 ? 'text-emerald-400' : 'text-white'}
            />
          </div>
        </div>
      </section>

      {/* ── Content Section (white) ──────────────────────────── */}
      <section className="relative bg-white">
        {/* Curved transition */}
        <div className="absolute -top-px left-0 right-0 h-16 bg-gray-950" />
        <div className="absolute left-0 right-0 top-0 h-16 rounded-t-[2rem] bg-white" />

        <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
          {/* ── Tab Bar ──────────────────────────────────── */}
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:px-4 sm:py-2.5 sm:text-sm',
                  activeTab === tab.key
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* ─────────────── TAB: Overview ──────────────── */}
          {activeTab === 'overview' && (
            <div>
              {/* Performance Charts */}
              <SectionLabel>Performance</SectionLabel>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-black">Performance Trend</h3>
                    {metrics.length > 0 && (
                      <MetricSlicer metrics={metrics} value={selectedMetricId} onChange={setSelectedMetricId} />
                    )}
                  </div>
                  {metricTrends.length > 0 ? (
                    <AnalyticsLineChart
                      data={metricTrends}
                      xKey="date"
                      lines={[
                        { key: 'Best Score', color: CHART_BLACK, name: 'Best' },
                        { key: 'Average', color: CHART_GRAY, name: 'Average', strokeDasharray: '5 5' },
                      ]}
                      height={240}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Trophy className="mb-2 h-8 w-8 text-gray-200" />
                      <p className="text-sm text-gray-400">No performance data yet</p>
                    </div>
                  )}
                  {selectedMetric && latestBestScore != null && (
                    <p className="mt-3 text-center text-xs text-gray-400">
                      Latest best {selectedMetric.name}: <span className="font-semibold text-black">{latestBestScore}</span>
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-black">Training Load</h3>
                    <p className="text-xs text-gray-400">Last 30 days</p>
                  </div>
                  {loadChartData.length > 0 ? (
                    <AnalyticsAreaChart
                      data={loadChartData}
                      xKey="date"
                      areas={[{ key: 'Training Load', color: CHART_BLACK, name: 'Load' }]}
                      height={240}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Activity className="mb-2 h-8 w-8 text-gray-200" />
                      <p className="text-sm text-gray-400">No load data yet</p>
                    </div>
                  )}
                  {dailyLoads.length > 0 && (
                    <p className="mt-3 text-center text-xs text-gray-400">
                      {dailyLoads.length} sessions recorded ·{' '}
                      <span className="font-semibold text-black">
                        {dailyLoads.reduce((s, l) => s + l.trainingLoad, 0).toLocaleString()}
                      </span>{' '}
                      total load
                    </p>
                  )}
                </div>
              </div>

              {/* Radar Chart */}
              {radarData.length >= 3 && (
                <div className="mt-6 rounded-xl border border-border bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-black">Performance Profile</h3>
                  <AnalyticsRadarChart
                    data={radarData}
                    athletes={[
                      { key: 'Current', name: 'Current', color: CHART_BLACK },
                      { key: '30 Days Ago', name: '30 Days Ago', color: CHART_GRAY },
                    ]}
                    height={300}
                  />
                  <p className="mt-2 text-center text-xs text-gray-400">
                    Normalized scores (0–100) across all metrics
                  </p>
                </div>
              )}

              {/* Personal Records */}
              {personalRecords.length > 0 && (
                <>
                  <div className="mt-8">
                    <SectionLabel>Personal Records</SectionLabel>
                  </div>
                  <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Metric</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">PR Value</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400" />
                        </tr>
                      </thead>
                      <tbody>
                        {personalRecords.map((pr) => (
                          <tr key={pr.metricId} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 font-medium text-black">{pr.metricName}</td>
                            <td className="px-4 py-3 text-right font-semibold text-black">
                              {pr.prValue}
                              <span className="ml-1 text-xs text-gray-400">{pr.metricUnit}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500">
                              {new Date(pr.dateAchieved).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {pr.isRecent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600 ring-1 ring-amber-200">
                                  <Trophy className="h-3 w-3" />
                                  NEW PR
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Weekly Volume */}
              <div className="mt-8">
                <SectionLabel>Weekly Volume</SectionLabel>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <WeeklyVolumeStat label="Sessions" current={weeklyVolume.currentWeek.sessions} changePercent={weeklyVolume.changes.sessionsPercent} />
                <WeeklyVolumeStat label="Total Load" current={weeklyVolume.currentWeek.totalLoad} changePercent={weeklyVolume.changes.loadPercent} formatValue={(v) => v.toLocaleString()} />
                <WeeklyVolumeStat label="Avg RPE" current={weeklyVolume.currentWeek.avgRpe} changePercent={weeklyVolume.changes.rpePercent} invertColor />
              </div>

              {/* Bio + Recent Activity */}
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div>
                  <SectionLabel>Bio</SectionLabel>
                  <div className="mt-4 space-y-3">
                    <BioItem icon={<Trophy className="h-4 w-4 text-gray-400" />} label="Sport" value={athlete.sportName || '—'} />
                    <BioItem icon={<User className="h-4 w-4 text-gray-400" />} label="Position" value={athlete.position || '—'} />
                    <BioItem icon={<BookOpen className="h-4 w-4 text-gray-400" />} label="Program" value={athlete.programName || '—'} />
                    <BioItem icon={<Calendar className="h-4 w-4 text-gray-400" />} label="Age" value={age != null ? `${age} years` : '—'} />
                  </div>
                  <div className="mt-6">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Injury Summary</p>
                    <div className="grid grid-cols-2 gap-2">
                      <MiniStat value={injuries.length} label="Total" />
                      <MiniStat value={activeInjuryCount} label="Active" danger={activeInjuryCount > 0} />
                      <MiniStat value={totalDaysLost} label="Days Lost" danger={totalDaysLost > 0} />
                      <MiniStat value={testingSessions.length} label="Tests" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <SectionLabel>Recent Activity</SectionLabel>
                  <div className="mt-4">
                    {timelineEvents.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-400">No activity recorded</p>
                    ) : (
                      <div className="relative space-y-0">
                        <div className="absolute bottom-3 left-[15px] top-3 w-px bg-border" />
                        {timelineEvents.map((evt) => (
                          <div key={evt.id} className="relative flex items-start gap-3 rounded-lg px-1 py-2.5">
                            <div className={cn('relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full', typeDot[evt.type])}>
                              {typeIcon[evt.type]}
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <p className="text-sm font-medium text-black">{evt.label}</p>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {new Date(evt.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="truncate text-xs text-gray-500">{evt.detail}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────── TAB: Training ──────────────── */}
          {activeTab === 'training' && (
            <div>
              {/* Streaks + Compliance */}
              {dailyLoads.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 ring-1 ring-orange-200">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-lg font-bold text-orange-600">{trainingStreaks.currentStreak}</p>
                        <p className="text-[10px] text-orange-400">Current Streak</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-lg font-bold text-amber-600">{trainingStreaks.longestStreak}</p>
                        <p className="text-[10px] text-amber-400">Longest Streak</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 ring-1 ring-blue-200">
                      <Target className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-lg font-bold text-blue-600">{compliance.weeklyPercent}%</p>
                        <p className="text-[10px] text-blue-400">Weekly Compliance</p>
                      </div>
                    </div>
                  </div>

                  {/* Heatmap */}
                  <div className="mt-6 rounded-xl border border-border bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-black">Training Heatmap</h3>
                    <div className="overflow-x-auto">
                      <CalendarHeatmap data={heatmapData} />
                    </div>
                  </div>

                  {/* 30-Day Sparklines */}
                  {(loadSparkline.length >= 2 || rpeSparkline.length >= 2 || readinessSparkline.length >= 2) && (
                    <>
                      <div className="mt-8">
                        <SectionLabel>30-Day Trends</SectionLabel>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {loadSparkline.length >= 2 && <SparklineCard label="Training Load" data={loadSparkline} color="#000" />}
                        {rpeSparkline.length >= 2 && <SparklineCard label="RPE" data={rpeSparkline} color="#f59e0b" />}
                        {readinessSparkline.length >= 2 && <SparklineCard label="Readiness" data={readinessSparkline} color="#22c55e" />}
                      </div>
                    </>
                  )}

                  {/* Weekly Volume */}
                  <div className="mt-8">
                    <SectionLabel>Weekly Volume</SectionLabel>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <WeeklyVolumeStat label="Sessions" current={weeklyVolume.currentWeek.sessions} changePercent={weeklyVolume.changes.sessionsPercent} />
                    <WeeklyVolumeStat label="Total Load" current={weeklyVolume.currentWeek.totalLoad} changePercent={weeklyVolume.changes.loadPercent} formatValue={(v) => v.toLocaleString()} />
                    <WeeklyVolumeStat label="Avg RPE" current={weeklyVolume.currentWeek.avgRpe} changePercent={weeklyVolume.changes.rpePercent} invertColor />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <Dumbbell className="mb-2 h-8 w-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No training data yet</p>
                </div>
              )}
            </div>
          )}

          {/* ─────────────── TAB: Wellness ──────────────── */}
          {activeTab === 'wellness' && (
            <div>
              {wellnessBreakdown ? (
                <>
                  {/* Wellness Breakdown Cards */}
                  <SectionLabel>Wellness Averages</SectionLabel>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <WellnessStatCard icon={<Moon className="h-4 w-4 text-indigo-500" />} label="Sleep Hours" value={`${wellnessBreakdown.sleepHours}h`} color="indigo" />
                    <WellnessStatCard icon={<Moon className="h-4 w-4 text-purple-500" />} label="Sleep Quality" value={`${wellnessBreakdown.sleepQuality}/10`} color="purple" />
                    <WellnessStatCard icon={<Activity className="h-4 w-4 text-red-500" />} label="Soreness" value={`${wellnessBreakdown.soreness}/10`} color="red" invert />
                    <WellnessStatCard icon={<Zap className="h-4 w-4 text-amber-500" />} label="Fatigue" value={`${wellnessBreakdown.fatigue}/10`} color="amber" invert />
                    <WellnessStatCard
                      icon={wellnessBreakdown.mood >= 7 ? <Smile className="h-4 w-4 text-emerald-500" /> : wellnessBreakdown.mood >= 4 ? <Meh className="h-4 w-4 text-amber-500" /> : <Frown className="h-4 w-4 text-red-500" />}
                      label="Mood"
                      value={`${wellnessBreakdown.mood}/10`}
                      color={wellnessBreakdown.mood >= 7 ? 'emerald' : wellnessBreakdown.mood >= 4 ? 'amber' : 'red'}
                    />
                    <WellnessStatCard icon={<Droplets className="h-4 w-4 text-cyan-500" />} label="Hydration" value={`${wellnessBreakdown.hydration}/10`} color="cyan" />
                  </div>
                  <p className="mt-2 text-center text-xs text-gray-400">
                    Averages from last {wellnessBreakdown.count} check-in{wellnessBreakdown.count !== 1 ? 's' : ''}
                  </p>

                  {/* Readiness Sparkline */}
                  {readinessSparkline.length >= 2 && (
                    <>
                      <div className="mt-8">
                        <SectionLabel>Readiness Trend</SectionLabel>
                      </div>
                      <div className="mt-4">
                        <SparklineCard label="Readiness" data={readinessSparkline} color="#22c55e" />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <HeartPulse className="mb-2 h-8 w-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No wellness data yet</p>
                </div>
              )}
            </div>
          )}

          {/* ─────────────── TAB: Injuries ──────────────── */}
          {activeTab === 'injuries' && (
            <div>
              {injuries.length > 0 ? (
                <>
                  {/* Body Map + Details */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex items-center justify-center rounded-xl border border-border bg-white p-5 shadow-sm">
                      <BodyMap data={bodyMapData} compact />
                    </div>
                    <div className="space-y-3">
                      {injuries.slice(0, 6).map((inj) => (
                        <div
                          key={inj.id}
                          className={cn(
                            'rounded-lg border p-3',
                            inj.status === 'active' ? 'border-red-200 bg-red-50'
                              : inj.status === 'rehab' ? 'border-amber-200 bg-amber-50'
                              : inj.status === 'monitoring' ? 'border-blue-200 bg-blue-50'
                              : 'border-border bg-muted/30'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-black">{inj.bodyRegion}</p>
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                              inj.status === 'active' ? 'bg-red-100 text-red-600'
                                : inj.status === 'rehab' ? 'bg-amber-100 text-amber-600'
                                : inj.status === 'monitoring' ? 'bg-blue-100 text-blue-600'
                                : 'bg-emerald-100 text-emerald-600'
                            )}>
                              {inj.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{inj.description}</p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            {new Date(inj.dateOccurred).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {inj.daysLost != null && inj.daysLost > 0 && ` · ${inj.daysLost}d lost`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Return-to-Play */}
                  {activeInjuries.length > 0 && (
                    <>
                      <div className="mt-8">
                        <SectionLabel>Return-to-Play Progress</SectionLabel>
                      </div>
                      <div className="mt-4 space-y-4">
                        {activeInjuries.map((inj) => (
                          <ReturnToPlayTracker key={inj.id} injury={inj} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Injury Timeline */}
                  {injuries.length > 1 && (
                    <>
                      <div className="mt-8">
                        <SectionLabel>Injury Timeline</SectionLabel>
                      </div>
                      <div className="mt-4">
                        <InjuryTimeline injuries={injuries} />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <Shield className="mb-2 h-8 w-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No injuries recorded</p>
                </div>
              )}
            </div>
          )}

          {/* ─────────────── TAB: Goals ─────────────────── */}
          {activeTab === 'goals' && (
            <div>
              {/* Goals */}
              {goals.length > 0 ? (
                <>
                  <SectionLabel>Goals</SectionLabel>
                  <div className="mt-4 space-y-3">
                    {activeGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                    {achievedGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Target className="mb-2 h-8 w-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No goals set yet</p>
                </div>
              )}

              {/* Achievement Badges */}
              {badges.length > 0 && (
                <>
                  <div className="mt-8">
                    <SectionLabel>Achievements</SectionLabel>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {badges.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-gray-950 py-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white">DJP</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Athlete
            </span>
          </div>
          <p className="mt-2 text-xs text-white/20">
            Performance & Injury Monitoring Platform
          </p>
          <p className="mt-1 text-[11px] text-white/10">
            Profile generated on{' '}
            {new Date().toLocaleDateString('en-AU', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────

function GlassCard({
  value,
  label,
  icon,
  valueClassName,
  extra,
}: {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  valueClassName?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 backdrop-blur-xl sm:p-5">
      <div className="mb-2 text-white/30 sm:mb-3">{icon}</div>
      <div className="flex items-baseline gap-1.5">
        <p className={cn('text-2xl font-bold text-white sm:text-3xl', valueClassName)}>{value}</p>
        {extra}
      </div>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        {children}
      </p>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function BioItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
        <p className="truncate text-sm font-medium text-black">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({
  value,
  label,
  danger,
}: {
  value: string | number;
  label: string;
  danger?: boolean;
}) {
  return (
    <div className={cn('rounded-lg border border-border p-3 text-center', danger && 'bg-danger/5 border-danger/20')}>
      <p className={cn('text-xl font-bold text-black', danger && 'text-danger')}>{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}

function ReadinessGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));

  // SVG arc gauge params
  const svgW = 120;
  const svgH = 80;
  const cx = svgW / 2;
  const cy = 62;
  const radius = 46;
  const strokeWidth = 9;
  const startAngle = -135;
  const endAngle = 135;
  const angleRange = endAngle - startAngle;

  function polarToCartesian(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(start: number, end: number, r: number) {
    const s = polarToCartesian(start, r);
    const e = polarToCartesian(end, r);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  // Zone boundaries
  const amberAngle = startAngle + (40 / 100) * angleRange;
  const greenAngle = startAngle + (70 / 100) * angleRange;
  const valueAngle = startAngle + (clamped / 100) * angleRange;

  // Needle
  const needleTip = polarToCartesian(valueAngle, radius - 2);
  const needleBase1 = polarToCartesian(valueAngle + 90, 3);
  const needleBase2 = polarToCartesian(valueAngle - 90, 3);

  // Color label
  const color = clamped >= 70 ? '#22c55e' : clamped >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Background track */}
        <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Red zone */}
        <path d={arcPath(startAngle, amberAngle, radius)} fill="none" stroke="#ef4444" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.3} />
        {/* Amber zone */}
        <path d={arcPath(amberAngle, greenAngle, radius)} fill="none" stroke="#f59e0b" strokeWidth={strokeWidth} opacity={0.3} />
        {/* Green zone */}
        <path d={arcPath(greenAngle, endAngle, radius)} fill="none" stroke="#22c55e" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.3} />
        {/* Needle */}
        <polygon points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`} fill="white" />
        <circle cx={cx} cy={cy} r={4} fill="white" />
        {/* Score text */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize={22} fontWeight="bold">
          {clamped}
        </text>
      </svg>
    </div>
  );
}

function ReadinessSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const w = 80;
  const h = 24;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const lastColor = data[data.length - 1] >= 70 ? '#22c55e' : data[data.length - 1] >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeLinejoin="round" />
      {/* Last point dot */}
      {data.length > 0 && (
        <circle
          cx={pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)}
          cy={h - pad - ((data[data.length - 1] - min) / range) * (h - pad * 2)}
          r={2.5}
          fill={lastColor}
        />
      )}
    </svg>
  );
}

function WeeklyVolumeStat({
  label,
  current,
  changePercent,
  formatValue,
  invertColor,
}: {
  label: string;
  current: number;
  changePercent: number | null;
  formatValue?: (v: number) => string;
  invertColor?: boolean;
}) {
  const display = formatValue ? formatValue(current) : String(current);

  let changeColor = 'text-gray-400';
  let ChangeIcon: typeof TrendingUp | typeof Minus = Minus;

  if (changePercent !== null && changePercent !== 0) {
    const isPositive = changePercent > 0;
    ChangeIcon = isPositive ? TrendingUp : TrendingDown;

    if (invertColor) {
      // For RPE: increase = bad (red), decrease = good (green)
      changeColor = isPositive ? 'text-red-500' : 'text-emerald-500';
    } else {
      changeColor = isPositive ? 'text-emerald-500' : 'text-red-500';
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-black">{display}</p>
      <div className={cn('mt-1 flex items-center gap-1 text-xs font-medium', changeColor)}>
        <ChangeIcon className="h-3.5 w-3.5" />
        {changePercent !== null ? (
          <span>{changePercent > 0 ? '+' : ''}{changePercent}% vs last week</span>
        ) : (
          <span>No prior data</span>
        )}
      </div>
    </div>
  );
}

// ── New Subcomponents ─────────────────────────────────────────────

function WellnessStatCard({
  icon,
  label,
  value,
  color,
  invert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  invert?: boolean;
}) {
  const numVal = parseFloat(value);
  const isGood = invert ? numVal <= 4 : numVal >= 7;
  const isBad = invert ? numVal >= 7 : numVal <= 3;

  return (
    <div
      className={cn(
        'rounded-xl border p-3 text-center',
        `border-${color}-200 bg-${color}-50/50`
      )}
    >
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white">
        {icon}
      </div>
      <p className="text-lg font-bold text-black">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function SparklineCard({ label, data, color }: { label: string; data: number[]; color: string }) {
  if (data.length < 2) return null;

  const w = 120;
  const h = 32;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const latest = data[data.length - 1];

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm font-bold text-black">{Math.round(latest * 10) / 10}</p>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-2">
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        <circle
          cx={pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)}
          cy={h - pad - ((latest - min) / range) * (h - pad * 2)}
          r={2.5}
          fill={color}
        />
      </svg>
      <p className="mt-1 text-[10px] text-gray-400">30-day trend</p>
    </div>
  );
}

const RTP_PHASES = [
  { key: 'active', label: 'Active', color: 'bg-red-500' },
  { key: 'rehab', label: 'Rehab', color: 'bg-amber-500' },
  { key: 'monitoring', label: 'Return to Training', color: 'bg-blue-500' },
  { key: 'resolved', label: 'Full Clearance', color: 'bg-emerald-500' },
] as const;

function ReturnToPlayTracker({ injury }: { injury: Injury }) {
  const currentIndex = RTP_PHASES.findIndex((p) => p.key === injury.status);
  const progress = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-black">{injury.bodyRegion}</p>
        <span className="text-xs text-gray-400">{injury.description}</span>
      </div>
      {/* Progress bar */}
      <div className="mt-3 flex gap-1">
        {RTP_PHASES.map((phase, i) => (
          <div key={phase.key} className="flex-1">
            <div
              className={cn(
                'h-2 rounded-full',
                i <= progress ? phase.color : 'bg-gray-200'
              )}
            />
            <p
              className={cn(
                'mt-1 text-[9px]',
                i <= progress ? 'font-semibold text-gray-700' : 'text-gray-300'
              )}
            >
              {phase.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InjuryTimeline({ injuries }: { injuries: Injury[] }) {
  const sorted = [...injuries].sort(
    (a, b) => new Date(a.dateOccurred).getTime() - new Date(b.dateOccurred).getTime()
  );

  // Compute time range
  const earliest = new Date(sorted[0].dateOccurred).getTime();
  const latestDate = Math.max(
    ...sorted.map((i) =>
      i.dateResolved ? new Date(i.dateResolved).getTime() : Date.now()
    )
  );
  const totalRange = latestDate - earliest || 1;

  return (
    <div className="space-y-2 overflow-x-auto rounded-xl border border-border bg-white p-4 shadow-sm">
      {sorted.map((inj) => {
        const start = new Date(inj.dateOccurred).getTime();
        const end = inj.dateResolved ? new Date(inj.dateResolved).getTime() : Date.now();
        const leftPct = ((start - earliest) / totalRange) * 100;
        const widthPct = Math.max(((end - start) / totalRange) * 100, 2);

        const barColor =
          inj.status === 'active'
            ? 'bg-red-400'
            : inj.status === 'rehab'
              ? 'bg-amber-400'
              : inj.status === 'monitoring'
                ? 'bg-blue-400'
                : 'bg-emerald-400';

        return (
          <div key={inj.id} className="flex items-center gap-3">
            <p className="w-24 shrink-0 truncate text-xs font-medium text-gray-600">{inj.bodyRegion}</p>
            <div className="relative h-5 flex-1 rounded bg-gray-100">
              <div
                className={cn('absolute top-0.5 h-4 rounded', barColor)}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                title={`${new Date(inj.dateOccurred).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })} — ${inj.dateResolved ? new Date(inj.dateResolved).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }) : 'Ongoing'}`}
              />
            </div>
          </div>
        );
      })}
      {/* Time axis */}
      <div className="flex items-center gap-3">
        <div className="w-24 shrink-0" />
        <div className="flex flex-1 justify-between text-[9px] text-gray-400">
          <span>
            {new Date(earliest).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' })}
          </span>
          <span>
            {new Date(latestDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const isAchieved = goal.status === 'achieved';
  const progressPct =
    goal.currentBest != null && goal.targetValue > 0
      ? goal.direction === 'higher'
        ? Math.min(100, Math.round((goal.currentBest / goal.targetValue) * 100))
        : Math.min(100, Math.round((goal.targetValue / goal.currentBest) * 100))
      : 0;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 shadow-sm',
        isAchieved ? 'border-emerald-200 bg-emerald-50/50' : 'border-border bg-white'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAchieved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Target className="h-4 w-4 text-blue-500" />
          )}
          <p className="text-sm font-medium text-black">{goal.metricName}</p>
        </div>
        {goal.deadline && (
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock className="h-3 w-3" />
            {new Date(goal.deadline).toLocaleDateString('en-AU', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isAchieved ? 'bg-emerald-500' : 'bg-blue-500'
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-black">{progressPct}%</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>
          Current: {goal.currentBest != null ? goal.currentBest : '—'}
        </span>
        <span>
          Target: {goal.targetValue} ({goal.direction === 'higher' ? '↑' : '↓'})
        </span>
      </div>
      {isAchieved && goal.achievedDate && (
        <p className="mt-1 text-[11px] text-emerald-600">
          Achieved on{' '}
          {new Date(goal.achievedDate).toLocaleDateString('en-AU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}
    </div>
  );
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  flame: <Flame className="h-5 w-5" />,
  trophy: <Trophy className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
};

function BadgeCard({ badge }: { badge: AchievementBadge }) {
  const icon = BADGE_ICONS[badge.icon] || <Trophy className="h-5 w-5" />;
  const progressPct = badge.target > 0 ? Math.round((badge.progress / badge.target) * 100) : 0;

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border p-4 text-center',
        badge.earned
          ? 'border-amber-200 bg-amber-50/50'
          : 'border-border bg-gray-50 opacity-60'
      )}
    >
      <div
        className={cn(
          'mb-2 flex h-10 w-10 items-center justify-center rounded-full',
          badge.earned ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-400'
        )}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold text-black">{badge.name}</p>
      <p className="mt-0.5 text-[10px] text-gray-400">{badge.description}</p>
      {badge.earned && badge.earnedDate ? (
        <p className="mt-2 text-[10px] font-medium text-amber-600">
          {new Date(badge.earnedDate).toLocaleDateString('en-AU', {
            day: '2-digit',
            month: 'short',
          })}
        </p>
      ) : (
        <div className="mt-2 w-full">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gray-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-[9px] text-gray-400">
            {badge.progress}/{badge.target}
          </p>
        </div>
      )}
    </div>
  );
}
