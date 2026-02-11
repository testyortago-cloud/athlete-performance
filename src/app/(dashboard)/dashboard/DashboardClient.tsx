'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { ChartCard } from '@/components/charts/ChartCard';
import { AnalyticsBarChart } from '@/components/charts/BarChart';
import { AnalyticsLineChart } from '@/components/charts/LineChart';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useNotificationStore } from '@/stores/notificationStore';
import { CHART_BLACK, CHART_GRAY, CHART_DANGER, CHART_WARNING, CHART_SUCCESS } from '@/components/charts/chartColors';
import type { Athlete, Sport, InjurySummary, InjuryTypeSummary, LoadTrend, RiskIndicator, RiskAlert } from '@/types';

interface DashboardClientProps {
  kpis: {
    activeAthletes: number;
    activeInjuries: number;
    avgLoad: number;
    sessionsThisMonth: number;
  };
  injuryByRegion: InjurySummary[];
  injuryByType: InjuryTypeSummary[];
  loadTrends: LoadTrend[];
  riskIndicators: RiskIndicator[];
  alerts: RiskAlert[];
  athletes: Athlete[];
  sports: Sport[];
}

function getRiskBadgeVariant(level: string) {
  switch (level) {
    case 'high': return 'danger' as const;
    case 'moderate': return 'warning' as const;
    default: return 'success' as const;
  }
}

export function DashboardClient({
  kpis,
  injuryByRegion,
  injuryByType,
  loadTrends,
  riskIndicators,
  alerts,
  athletes,
  sports,
}: DashboardClientProps) {
  const router = useRouter();
  const { crossFilter, setCrossFilter, clearCrossFilter } = useDashboardFilters();
  const { setNotifications } = useNotificationStore();

  // Populate notification bell with risk alerts
  useEffect(() => {
    if (alerts.length > 0) {
      setNotifications(
        alerts.map((a, i) => ({
          id: `alert-${i}`,
          message: `${a.athleteName}: ${a.message}`,
          severity: a.severity === 'danger' ? 'danger' : 'warning',
          date: a.date,
          read: false,
        }))
      );
    }
  }, [alerts, setNotifications]);

  // Filter injury data based on cross-filter
  const filteredInjuryByRegion = crossFilter.source === 'injuryType'
    ? injuryByRegion // would filter by type if connected
    : injuryByRegion;

  const riskColors = riskIndicators.map((r) =>
    r.riskLevel === 'high' ? CHART_DANGER : r.riskLevel === 'moderate' ? CHART_WARNING : CHART_SUCCESS
  );

  return (
    <>
      <PageHeader title="Dashboard" />
      <FilterBar sports={sports} athletes={athletes} />

      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active Athletes" value={kpis.activeAthletes} icon="users" />
        <KpiCard label="Active Injuries" value={kpis.activeInjuries} icon="alert-triangle" />
        <KpiCard label="Avg Load (7d)" value={kpis.avgLoad} icon="activity" />
        <KpiCard label="Sessions This Month" value={kpis.sessionsThisMonth} icon="clipboard" />
      </div>

      {/* Charts Grid */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Injuries by Body Region"
          subtitle="Top 5 regions"
        >
          {injuryByRegion.length > 0 ? (
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
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No injury data</p>
          )}
        </ChartCard>

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

        <ChartCard
          title="Team Load Trend"
          subtitle="30-day average training load"
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

        <ChartCard title="Risk Overview (ACWR)">
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
      </div>

      {/* Alerts */}
      <AlertsPanel alerts={alerts} />
    </>
  );
}
