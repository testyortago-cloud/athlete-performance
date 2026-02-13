'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { ChartCard } from '@/components/charts/ChartCard';
import { AnalyticsBarChart } from '@/components/charts/BarChart';
import { AnalyticsLineChart } from '@/components/charts/LineChart';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useNotificationStore } from '@/stores/notificationStore';
import { useWidgetStore, ALL_WIDGETS, WIDGET_LABELS, type WidgetKey } from '@/stores/widgetStore';
import { useNotificationPrefsStore } from '@/stores/notificationPrefsStore';
import { useToastStore } from '@/stores/toastStore';
import { Clock, Activity, ClipboardList, HeartPulse, SlidersHorizontal, RotateCcw, Eye, EyeOff, Share2 } from 'lucide-react';
import { CHART_BLACK, CHART_GRAY, CHART_DANGER, CHART_WARNING, CHART_SUCCESS } from '@/components/charts/chartColors';
import { BodyMap } from '@/components/charts/BodyMap';
import type { Athlete, Sport, Injury, InjurySummary, InjuryTypeSummary, LoadTrend, RiskIndicator, RiskAlert } from '@/types';

interface DashboardClientProps {
  kpis: {
    activeAthletes: number;
    activeInjuries: number;
    avgLoad: number;
    sessionsThisMonth: number;
  };
  sparklines?: {
    athletes: number[];
    injuries: number[];
    load: number[];
    sessions: number[];
  };
  injuryByRegion: InjurySummary[];
  injuryByType: InjuryTypeSummary[];
  loadTrends: LoadTrend[];
  riskIndicators: RiskIndicator[];
  alerts: RiskAlert[];
  athletes: Athlete[];
  sports: Sport[];
  injuries: Injury[];
  loadSpikeAthletes: string[];
  lastUpdated: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getRiskBadgeVariant(level: string) {
  switch (level) {
    case 'high': return 'danger' as const;
    case 'moderate': return 'warning' as const;
    default: return 'success' as const;
  }
}

function ShareDashboard() {
  const { addToast } = useToastStore();

  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      addToast('Dashboard link copied to clipboard', 'success');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      addToast('Dashboard link copied to clipboard', 'success');
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      icon={<Share2 className="h-3.5 w-3.5" />}
      onClick={handleShare}
    >
      Share
    </Button>
  );
}

function WidgetCustomizer() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { hidden, toggle, resetAll, isVisible } = useWidgetStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        size="sm"
        variant="outline"
        icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
        onClick={() => setOpen(!open)}
      >
        Customize
        {hidden.length > 0 && (
          <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
            {hidden.length}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-border bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Visible Widgets
            </p>
            {hidden.length > 0 && (
              <button
                onClick={resetAll}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-black transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
          <div className="space-y-1">
            {ALL_WIDGETS.map((key) => {
              const visible = isVisible(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                >
                  {visible ? (
                    <Eye className="h-3.5 w-3.5 text-black shrink-0" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                  )}
                  <span className={visible ? 'text-black' : 'text-gray-400 line-through'}>
                    {WIDGET_LABELS[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardClient({
  kpis,
  sparklines,
  injuryByRegion,
  injuryByType,
  loadTrends,
  riskIndicators,
  alerts,
  athletes,
  sports,
  injuries,
  loadSpikeAthletes,
  lastUpdated,
}: DashboardClientProps) {
  const router = useRouter();
  const { crossFilter, setCrossFilter, clearCrossFilter } = useDashboardFilters();
  const { setNotifications } = useNotificationStore();
  const { highRiskAlerts, loadSpikeAlerts, injuryUpdates } = useNotificationPrefsStore();

  // Populate notification bell based on all notification preferences
  useEffect(() => {
    const notifications: import('@/stores/notificationStore').Notification[] = [];
    const today = new Date().toISOString().split('T')[0];

    // High risk ACWR alerts
    if (highRiskAlerts) {
      for (const a of alerts) {
        notifications.push({
          id: `alert-${a.athleteName}-${a.severity}-${a.date}`,
          message: `${a.athleteName}: ${a.message}`,
          severity: a.severity === 'danger' ? 'danger' as const : 'warning' as const,
          type: 'risk' as const,
          athleteName: a.athleteName,
          date: a.date,
          read: false,
        });
      }
    }

    // Load spike alerts
    if (loadSpikeAlerts) {
      for (const athleteName of loadSpikeAthletes) {
        notifications.push({
          id: `load-spike-${athleteName}-${today}`,
          message: `${athleteName}: Training load spike detected — week-over-week increase exceeds threshold`,
          severity: 'warning' as const,
          type: 'load-spike' as const,
          athleteName,
          date: today,
          read: false,
        });
      }
    }

    // Injury update alerts
    if (injuryUpdates) {
      const activeInjuries = injuries.filter((i) => i.status !== 'resolved');
      for (const injury of activeInjuries) {
        const athleteName = injury.athleteName || athletes.find((a) => a.id === injury.athleteId)?.name || 'Unknown';
        notifications.push({
          id: `injury-${injury.id}`,
          message: `${athleteName}: ${injury.status === 'active' ? 'Active' : injury.status === 'rehab' ? 'In rehab' : 'Monitoring'} ${injury.type} — ${injury.bodyRegion} (${injury.description})`,
          severity: injury.status === 'active' ? 'danger' as const : 'warning' as const,
          type: 'injury' as const,
          athleteName,
          date: injury.dateOccurred,
          read: false,
        });
      }
    }

    setNotifications(notifications);
  }, [alerts, setNotifications, highRiskAlerts, loadSpikeAlerts, injuryUpdates, loadSpikeAthletes, injuries, athletes]);

  // Filter injury data based on cross-filter
  const filteredInjuryByRegion = crossFilter.source === 'injuryType'
    ? injuryByRegion // would filter by type if connected
    : injuryByRegion;

  const riskColors = riskIndicators.map((r) =>
    r.riskLevel === 'high' ? CHART_DANGER : r.riskLevel === 'moderate' ? CHART_WARNING : CHART_SUCCESS
  );

  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'Coach';
  const highRiskCount = riskIndicators.filter((r) => r.riskLevel === 'high').length;
  const w = useWidgetStore();

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              Last updated: {new Date(lastUpdated).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <ShareDashboard />
            <WidgetCustomizer />
          </div>
        }
      />

      {/* Welcome Banner */}
      {w.isVisible('welcome') && (
        <Card className="mb-6 bg-black text-white border-black" data-tour="welcome-banner">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {getGreeting()}, {firstName}
              </h2>
              <p className="mt-0.5 text-sm text-white/60">
                {highRiskCount > 0
                  ? `${highRiskCount} athlete${highRiskCount > 1 ? 's' : ''} at high risk today`
                  : kpis.activeAthletes > 0
                    ? `${kpis.activeAthletes} active athletes being monitored`
                    : 'Welcome to your dashboard'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/load-monitoring')}
                className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
              >
                <Activity className="h-3.5 w-3.5" />
                Log Load
              </button>
              <button
                onClick={() => router.push('/testing/new')}
                className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                New Session
              </button>
              <button
                onClick={() => router.push('/injuries')}
                className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
              >
                <HeartPulse className="h-3.5 w-3.5" />
                Record Injury
              </button>
            </div>
          </div>
        </Card>
      )}

      <FilterBar sports={sports} athletes={athletes} />

      {/* KPI Row */}
      {w.isVisible('kpis') && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="kpi-row">
          <KpiCard label="Active Athletes" value={kpis.activeAthletes} icon="users" sparklineData={sparklines?.athletes} />
          <KpiCard label="Active Injuries" value={kpis.activeInjuries} icon="alert-triangle" sparklineData={sparklines?.injuries} sparklineColor="#EF4444" />
          <KpiCard label="Avg Load (7d)" value={kpis.avgLoad} icon="activity" sparklineData={sparklines?.load} />
          <KpiCard label="Sessions This Month" value={kpis.sessionsThisMonth} icon="clipboard" sparklineData={sparklines?.sessions} />
        </div>
      )}

      {/* Charts Grid */}
      {(w.isVisible('injuryByRegion') || w.isVisible('injuryByType') || w.isVisible('loadTrend') || w.isVisible('riskOverview')) && (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2" data-tour="charts-grid">
          {w.isVisible('injuryByRegion') && (
            <ChartCard
              title="Injuries by Body Region"
              subtitle="Top 5 regions"
            >
              {injuryByRegion.length > 0 ? (
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="shrink-0">
                    <BodyMap
                      data={injuryByRegion.map((d) => ({ region: d.bodyRegion, count: d.count }))}
                      compact
                    />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <AnalyticsBarChart
                      data={filteredInjuryByRegion.map((d) => ({ name: d.bodyRegion, count: d.count }))}
                      xKey="name"
                      bars={[{ key: 'count', color: CHART_BLACK, name: 'Count' }]}
                      layout="vertical"
                      height={250}
                      onClick={(d) => {
                        if (crossFilter.value === d.name) {
                          clearCrossFilter();
                        } else {
                          setCrossFilter('injuryRegion', 'bodyRegion', d.name as string);
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">No injury data</p>
              )}
            </ChartCard>
          )}

          {w.isVisible('injuryByType') && (
            <ChartCard title="Injuries by Type">
              {injuryByType.length > 0 ? (
                <AnalyticsBarChart
                  data={injuryByType.map((d) => ({ name: d.type, count: d.count }))}
                  xKey="name"
                  bars={[{ key: 'count', color: CHART_GRAY, name: 'Count' }]}
                  height={250}
                />
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">No injury data</p>
              )}
            </ChartCard>
          )}

          {w.isVisible('loadTrend') && (
            <ChartCard
              title="Team Load Trend"
              subtitle="30-day average training load"
              helpTip={{ term: 'Training Load', description: 'Calculated as RPE × Session Duration. Tracks cumulative physical stress on athletes over time.' }}
            >
              {loadTrends.length > 0 ? (
                <AnalyticsLineChart
                  data={loadTrends.map((d) => ({
                    date: new Date(d.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
                    'Training Load': d.trainingLoad,
                    RPE: d.rpe,
                  }))}
                  xKey="date"
                  lines={[
                    { key: 'Training Load', color: CHART_BLACK, name: 'Training Load' },
                    { key: 'RPE', color: CHART_GRAY, name: 'Avg RPE', strokeDasharray: '5 5' },
                  ]}
                  height={250}
                />
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">No load data</p>
              )}
            </ChartCard>
          )}

          {w.isVisible('riskOverview') && (
            <ChartCard
              title="Risk Overview (ACWR)"
              helpTip={{ term: 'ACWR', description: 'Acute:Chronic Workload Ratio — compares recent (7-day) training load to longer-term (28-day) average. Values above your threshold indicate increased injury risk.' }}
            >
              {riskIndicators.length > 0 ? (
                <Card padding="none" className="border-0 shadow-none">
                  <div className="max-h-[250px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/60 text-left">
                          <th className="px-3 py-2 text-sm font-medium text-gray-500">Athlete</th>
                          <th className="px-3 py-2 text-sm font-medium text-gray-500">ACWR</th>
                          <th className="px-3 py-2 text-sm font-medium text-gray-500">Risk</th>
                          <th className="px-3 py-2 text-sm font-medium text-gray-500">Injuries</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riskIndicators
                          .sort((a, b) => b.acwr - a.acwr)
                          .map((r) => (
                            <tr
                              key={r.athleteId}
                              className="cursor-pointer border-b border-border border-l-2 border-l-transparent bg-white last:border-b-0 hover:bg-surface hover:border-l-black transition-colors"
                              onClick={() => router.push(`/athletes/${r.athleteId}`)}
                            >
                              <td className="px-3 py-2 font-medium text-black">{r.athleteName}</td>
                              <td className="px-3 py-2 text-black">{r.acwr}</td>
                              <td className="px-3 py-2">
                                <Badge variant={getRiskBadgeVariant(r.riskLevel)}>
                                  {r.riskLevel}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-gray-600">{r.activeInjuries}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">No risk data</p>
              )}
            </ChartCard>
          )}
        </div>
      )}

      {/* Alerts */}
      {w.isVisible('alerts') && (
        <div data-tour="alerts-panel">
          <AlertsPanel alerts={alerts} />
        </div>
      )}
    </>
  );
}
