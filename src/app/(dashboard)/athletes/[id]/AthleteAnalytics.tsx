'use client';

import { useState } from 'react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { AnalyticsLineChart } from '@/components/charts/LineChart';
import { AnalyticsAreaChart } from '@/components/charts/AreaChart';
import { MetricSlicer } from '@/components/dashboard/MetricSlicer';
import { CHART_BLACK, CHART_GRAY } from '@/components/charts/chartColors';
import type { Metric, PerformanceTrend, LoadTrend, RiskIndicator } from '@/types';

interface AthleteAnalyticsProps {
  metrics: Metric[];
  performanceTrends: PerformanceTrend[];
  loadTrends: LoadTrend[];
  riskIndicator: RiskIndicator | null;
  avgRpeWeek: number;
  totalDaysLost: number;
}

export function AthleteAnalytics({
  metrics,
  performanceTrends,
  loadTrends,
  riskIndicator,
  avgRpeWeek,
  totalDaysLost,
}: AthleteAnalyticsProps) {
  const [selectedMetricId, setSelectedMetricId] = useState(metrics[0]?.id || '');

  const metricTrends = performanceTrends
    .filter((t) => t.metricName === selectedMetricId)
    .map((t) => ({
      date: new Date(t.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
      'Best Score': t.bestScore,
      'Average': t.averageScore,
    }));

  const selectedMetric = metrics.find((m) => m.id === selectedMetricId);
  const latestBestScore = metricTrends.length > 0
    ? metricTrends[metricTrends.length - 1]['Best Score']
    : null;

  const loadChartData = loadTrends.map((l) => ({
    date: new Date(l.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
    'Training Load': l.trainingLoad,
    RPE: l.rpe,
  }));

  return (
    <>
      {/* Personal KPI Row */}
      <div className="mt-6 mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label={selectedMetric ? `Best ${selectedMetric.name}` : 'Best Score'}
          value={latestBestScore != null ? latestBestScore : '—'}
        />
        <KpiCard
          label="Avg RPE (7d)"
          value={avgRpeWeek || '—'}
        />
        <KpiCard
          label="Days Lost"
          value={totalDaysLost}
        />
        <KpiCard
          label="ACWR"
          value={riskIndicator?.acwr ?? '—'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Performance Trend"
          actions={
            metrics.length > 0 ? (
              <MetricSlicer
                metrics={metrics}
                value={selectedMetricId}
                onChange={setSelectedMetricId}
              />
            ) : undefined
          }
        >
          {metricTrends.length > 0 ? (
            <AnalyticsLineChart
              data={metricTrends}
              xKey="date"
              lines={[
                { key: 'Best Score', color: CHART_BLACK, name: 'Best' },
                { key: 'Average', color: CHART_GRAY, name: 'Average', strokeDasharray: '5 5' },
              ]}
              height={250}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              No performance data for this metric
            </p>
          )}
        </ChartCard>

        <ChartCard title="Training Load" subtitle="Last 30 days">
          {loadChartData.length > 0 ? (
            <AnalyticsAreaChart
              data={loadChartData}
              xKey="date"
              areas={[
                { key: 'Training Load', color: CHART_BLACK, name: 'Load' },
              ]}
              height={250}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No load data</p>
          )}
        </ChartCard>
      </div>
    </>
  );
}
