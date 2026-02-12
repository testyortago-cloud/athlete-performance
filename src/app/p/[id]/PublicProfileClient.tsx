'use client';

import { useState, useMemo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AnalyticsLineChart } from '@/components/charts/LineChart';
import { AnalyticsAreaChart } from '@/components/charts/AreaChart';
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
} from '@/types';

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
}: PublicProfileClientProps) {
  const [copied, setCopied] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState(metrics[0]?.id || '');

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
          {/* ── Performance Charts ─────────────────────────── */}
          <SectionLabel>Performance</SectionLabel>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {/* Performance Trend */}
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

            {/* Training Load */}
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

          {/* ── Bio + Activity Grid ────────────────────────── */}
          <div className="mt-8 grid gap-6 sm:mt-12 md:grid-cols-3">
            {/* Bio */}
            <div>
              <SectionLabel>Bio</SectionLabel>
              <div className="mt-4 space-y-3">
                <BioItem icon={<Trophy className="h-4 w-4 text-gray-400" />} label="Sport" value={athlete.sportName || '—'} />
                <BioItem icon={<User className="h-4 w-4 text-gray-400" />} label="Position" value={athlete.position || '—'} />
                <BioItem icon={<BookOpen className="h-4 w-4 text-gray-400" />} label="Program" value={athlete.programName || '—'} />
                <BioItem
                  icon={<Calendar className="h-4 w-4 text-gray-400" />}
                  label="Age"
                  value={age != null ? `${age} years` : '—'}
                />
              </div>

              {/* Injury summary */}
              <div className="mt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Injury Summary
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat value={injuries.length} label="Total" />
                  <MiniStat value={activeInjuryCount} label="Active" danger={activeInjuryCount > 0} />
                  <MiniStat value={totalDaysLost} label="Days Lost" danger={totalDaysLost > 0} />
                  <MiniStat value={testingSessions.length} label="Tests" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-2">
              <SectionLabel>Recent Activity</SectionLabel>
              <div className="mt-4">
                {timelineEvents.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">No activity recorded</p>
                ) : (
                  <div className="relative space-y-0">
                    <div className="absolute bottom-3 left-[15px] top-3 w-px bg-border" />
                    {timelineEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="relative flex items-start gap-3 rounded-lg px-1 py-2.5"
                      >
                        <div
                          className={cn(
                            'relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full',
                            typeDot[evt.type]
                          )}
                        >
                          {typeIcon[evt.type]}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm font-medium text-black">{evt.label}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {new Date(evt.date).toLocaleDateString('en-AU', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
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
