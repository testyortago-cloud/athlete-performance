'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { ChartCard } from '@/components/charts/ChartCard';
import { AnalyticsBarChart } from '@/components/charts/BarChart';
import { AnalyticsLineChart } from '@/components/charts/LineChart';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CHART_DANGER, CHART_WARNING, CHART_SUCCESS, CHART_BLACK, CHART_GRAY } from '@/components/charts/chartColors';
import type { RiskIndicator, RiskAlert, LoadTrend } from '@/types';

interface RiskClientProps {
  riskIndicators: RiskIndicator[];
  loadTrends: LoadTrend[];
  alerts: RiskAlert[];
  highRiskCount: number;
  moderateRiskCount: number;
  avgAcwr: number;
}

function getRiskBadgeVariant(level: string) {
  switch (level) {
    case 'high': return 'danger' as const;
    case 'moderate': return 'warning' as const;
    default: return 'success' as const;
  }
}

export function RiskClient({
  riskIndicators,
  loadTrends,
  alerts,
  highRiskCount,
  moderateRiskCount,
  avgAcwr,
}: RiskClientProps) {
  const router = useRouter();

  const acwrChartData = riskIndicators
    .sort((a, b) => b.acwr - a.acwr)
    .map((r) => ({
      name: r.athleteName,
      ACWR: r.acwr,
    }));

  const acwrColors = riskIndicators
    .sort((a, b) => b.acwr - a.acwr)
    .map((r) =>
      r.riskLevel === 'high' ? CHART_DANGER : r.riskLevel === 'moderate' ? CHART_WARNING : CHART_SUCCESS
    );

  const loadChartData = loadTrends.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
    'Avg Load': d.trainingLoad,
  }));

  return (
    <>
      <PageHeader
        title="Risk Analysis"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics/comparisons' },
          { label: 'Risk' },
        ]}
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="High Risk Athletes" value={highRiskCount} icon="alert-triangle" />
        <KpiCard label="Moderate Risk" value={moderateRiskCount} icon="activity" />
        <KpiCard label="Avg Team ACWR" value={avgAcwr} icon="users" />
      </div>

      {/* Risk Table */}
      <Card padding="none" className="mb-6">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-semibold text-black">Athlete Risk Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2 font-medium text-gray-500">Athlete</th>
                <th className="px-4 py-2 font-medium text-gray-500 text-right">Acute Load</th>
                <th className="px-4 py-2 font-medium text-gray-500 text-right">Chronic Load</th>
                <th className="px-4 py-2 font-medium text-gray-500 text-right">ACWR</th>
                <th className="px-4 py-2 font-medium text-gray-500">Risk Level</th>
                <th className="px-4 py-2 font-medium text-gray-500 text-right">Active Injuries</th>
              </tr>
            </thead>
            <tbody>
              {riskIndicators
                .sort((a, b) => b.acwr - a.acwr)
                .map((r) => (
                  <tr
                    key={r.athleteId}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-gray-50"
                    onClick={() => router.push(`/athletes/${r.athleteId}`)}
                  >
                    <td className="px-4 py-2.5 font-medium text-black">{r.athleteName}</td>
                    <td className="px-4 py-2.5 text-right text-black">{r.acuteLoad}</td>
                    <td className="px-4 py-2.5 text-right text-black">{r.chronicLoad}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-black">{r.acwr}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={getRiskBadgeVariant(r.riskLevel)}>
                        {r.riskLevel}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{r.activeInjuries}</td>
                  </tr>
                ))}
              {riskIndicators.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No risk data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="ACWR Distribution" subtitle="Per athlete, colored by risk zone">
          {acwrChartData.length > 0 ? (
            <AnalyticsBarChart
              data={acwrChartData}
              xKey="name"
              bars={[{ key: 'ACWR', color: CHART_BLACK, name: 'ACWR' }]}
              cellColors={acwrColors}
              height={300}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No ACWR data</p>
          )}
        </ChartCard>

        <ChartCard title="Team Load Trend" subtitle="28-day average load">
          {loadChartData.length > 0 ? (
            <AnalyticsLineChart
              data={loadChartData}
              xKey="date"
              lines={[{ key: 'Avg Load', color: CHART_BLACK, name: 'Avg Load' }]}
              height={300}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No load data</p>
          )}
        </ChartCard>
      </div>

      {/* Alerts */}
      <AlertsPanel alerts={alerts} />
    </>
  );
}
