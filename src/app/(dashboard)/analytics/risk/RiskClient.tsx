'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { ChartCard } from '@/components/charts/ChartCard';
import { AnalyticsBarChart } from '@/components/charts/BarChart';
import { AnalyticsLineChart } from '@/components/charts/LineChart';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import { CHART_DANGER, CHART_WARNING, CHART_SUCCESS, CHART_BLACK } from '@/components/charts/chartColors';
import { AlertTriangle, AlertCircle, CheckCircle, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RiskIndicator, RiskAlert, LoadTrend } from '@/types';

interface RiskClientProps {
  riskIndicators: RiskIndicator[];
  loadTrends: LoadTrend[];
  alerts: RiskAlert[];
  highRiskCount: number;
  moderateRiskCount: number;
  avgAcwr: number;
  acwrModerate?: number;
  acwrHigh?: number;
}

type RiskView = 'cards' | 'table';

function getRiskBadgeVariant(level: string) {
  switch (level) {
    case 'high': return 'danger' as const;
    case 'moderate': return 'warning' as const;
    default: return 'success' as const;
  }
}

function RiskTrafficLightCard({ indicator, onClick }: { indicator: RiskIndicator; onClick: () => void }) {
  const riskConfig = {
    high: {
      icon: <AlertTriangle className="h-5 w-5" />,
      borderColor: 'border-l-danger',
      iconColor: 'text-danger',
      bgColor: 'bg-danger/[0.03]',
      lightColor: 'bg-danger',
    },
    moderate: {
      icon: <AlertCircle className="h-5 w-5" />,
      borderColor: 'border-l-warning',
      iconColor: 'text-warning',
      bgColor: 'bg-warning/[0.03]',
      lightColor: 'bg-warning',
    },
    low: {
      icon: <CheckCircle className="h-5 w-5" />,
      borderColor: 'border-l-success',
      iconColor: 'text-success',
      bgColor: '',
      lightColor: 'bg-success',
    },
  };

  const config = riskConfig[indicator.riskLevel];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border border-border border-l-4 px-4 py-3 text-left transition-all hover:shadow-md',
        config.borderColor,
        config.bgColor
      )}
    >
      {/* Traffic light */}
      <div className="flex flex-col gap-1">
        <div className={cn('h-2.5 w-2.5 rounded-full', indicator.riskLevel === 'high' ? 'bg-danger' : 'bg-danger/20')} />
        <div className={cn('h-2.5 w-2.5 rounded-full', indicator.riskLevel === 'moderate' ? 'bg-warning' : 'bg-warning/20')} />
        <div className={cn('h-2.5 w-2.5 rounded-full', indicator.riskLevel === 'low' ? 'bg-success' : 'bg-success/20')} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-black truncate">{indicator.athleteName}</p>
          {indicator.trajectory === 'improving' && (
            <span title="Improving"><TrendingDown className="h-3.5 w-3.5 shrink-0 text-success" /></span>
          )}
          {indicator.trajectory === 'worsening' && (
            <span title="Worsening"><TrendingUp className="h-3.5 w-3.5 shrink-0 text-danger" /></span>
          )}
          {indicator.trajectory === 'stable' && (
            <span title="Stable"><Minus className="h-3.5 w-3.5 shrink-0 text-gray-400" /></span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
          <span>ACWR: <strong className="text-black">{indicator.acwr}</strong></span>
          {indicator.trajectory && indicator.trajectory !== 'stable' && (
            <span className={cn(
              'text-[10px] font-medium',
              indicator.trajectory === 'improving' ? 'text-success' : 'text-danger'
            )}>
              {indicator.trajectory === 'improving' ? 'Improving' : 'Worsening'}
            </span>
          )}
          {indicator.activeInjuries > 0 && (
            <Badge variant="danger" className="text-[10px] px-1.5 py-0">
              {indicator.activeInjuries} injury
            </Badge>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
    </button>
  );
}

export function RiskClient({
  riskIndicators,
  loadTrends,
  alerts,
  highRiskCount,
  moderateRiskCount,
  avgAcwr,
  acwrModerate = 1.3,
  acwrHigh = 1.5,
}: RiskClientProps) {
  const router = useRouter();
  const [riskView, setRiskView] = useState<RiskView>('cards');

  const highRisk = riskIndicators.filter((r) => r.riskLevel === 'high').sort((a, b) => b.acwr - a.acwr);
  const moderateRisk = riskIndicators.filter((r) => r.riskLevel === 'moderate').sort((a, b) => b.acwr - a.acwr);
  const lowRisk = riskIndicators.filter((r) => r.riskLevel === 'low').sort((a, b) => b.acwr - a.acwr);

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

      {/* View toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-black">Athlete Risk Status</h3>
        <div className="flex rounded-md border border-border">
          <button
            type="button"
            onClick={() => setRiskView('cards')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-l-md transition-colors',
              riskView === 'cards' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:text-black'
            )}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setRiskView('table')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-r-md transition-colors',
              riskView === 'table' ? 'bg-black text-white' : 'bg-white text-gray-500 hover:text-black'
            )}
          >
            Table
          </button>
        </div>
      </div>

      {riskView === 'cards' ? (
        <div className="mb-6 space-y-6">
          {/* High Risk Group */}
          {highRisk.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-danger" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-danger">
                  High Risk ({highRisk.length})
                </h4>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {highRisk.map((r) => (
                  <RiskTrafficLightCard
                    key={r.athleteId}
                    indicator={r}
                    onClick={() => router.push(`/athletes/${r.athleteId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Moderate Risk Group */}
          {moderateRisk.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-warning" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-warning">
                  Moderate Risk ({moderateRisk.length})
                </h4>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {moderateRisk.map((r) => (
                  <RiskTrafficLightCard
                    key={r.athleteId}
                    indicator={r}
                    onClick={() => router.push(`/athletes/${r.athleteId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Low Risk Group */}
          {lowRisk.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-success" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-success">
                  Low Risk ({lowRisk.length})
                </h4>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {lowRisk.map((r) => (
                  <RiskTrafficLightCard
                    key={r.athleteId}
                    indicator={r}
                    onClick={() => router.push(`/athletes/${r.athleteId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {riskIndicators.length === 0 && (
            <Card>
              <p className="py-8 text-center text-sm text-gray-400">No risk data available</p>
            </Card>
          )}
        </div>
      ) : (
        /* Table View */
        <Card padding="none" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 font-medium text-gray-500">Athlete</th>
                  <th className="px-4 py-2 font-medium text-gray-500 text-right">Acute Load</th>
                  <th className="px-4 py-2 font-medium text-gray-500 text-right">Chronic Load</th>
                  <th className="px-4 py-2 font-medium text-gray-500 text-right">ACWR</th>
                  <th className="px-4 py-2 font-medium text-gray-500">Risk Level</th>
                  <th className="px-4 py-2 font-medium text-gray-500">Trend</th>
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
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          {r.trajectory === 'improving' && <TrendingDown className="h-3.5 w-3.5 text-success" />}
                          {r.trajectory === 'worsening' && <TrendingUp className="h-3.5 w-3.5 text-danger" />}
                          {r.trajectory === 'stable' && <Minus className="h-3.5 w-3.5 text-gray-400" />}
                          <span className={cn(
                            'text-xs capitalize',
                            r.trajectory === 'improving' ? 'text-success' : r.trajectory === 'worsening' ? 'text-danger' : 'text-gray-400'
                          )}>
                            {r.trajectory || 'stable'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{r.activeInjuries}</td>
                    </tr>
                  ))}
                {riskIndicators.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No risk data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="ACWR Distribution"
          subtitle="Per athlete, colored by risk zone"
          helpTip={{ term: 'ACWR', description: 'Acute:Chronic Workload Ratio — compares recent (7-day) training load to longer-term (28-day) average. Values above threshold indicate increased injury risk.' }}
        >
          {acwrChartData.length > 0 ? (
            <AnalyticsBarChart
              data={acwrChartData}
              xKey="name"
              bars={[{ key: 'ACWR', color: CHART_BLACK, name: 'ACWR' }]}
              cellColors={acwrColors}
              referenceLines={[
                { y: acwrModerate, label: 'Moderate', color: CHART_WARNING },
                { y: acwrHigh, label: 'High', color: CHART_DANGER },
              ]}
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
