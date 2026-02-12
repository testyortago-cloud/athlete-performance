'use client';

import { useState } from 'react';
import { ChartCard } from '@/components/charts/ChartCard';
import { AnalyticsLineChart } from '@/components/charts/LineChart';
import { AnalyticsAreaChart } from '@/components/charts/AreaChart';
import { MetricSlicer } from '@/components/dashboard/MetricSlicer';
import { CHART_BLACK, CHART_GRAY } from '@/components/charts/chartColors';
import { cn } from '@/utils/cn';
import { Trophy, Zap, HeartPulse, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
      Average: t.averageScore,
    }));

  const selectedMetric = metrics.find((m) => m.id === selectedMetricId);
  const latestBestScore =
    metricTrends.length > 0 ? metricTrends[metricTrends.length - 1]['Best Score'] : null;

  const loadChartData = loadTrends.map((l) => ({
    date: new Date(l.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
    'Training Load': l.trainingLoad,
    RPE: l.rpe,
  }));

  const riskLevel = riskIndicator?.riskLevel || 'low';
  const rpeColor =
    avgRpeWeek <= 3 ? 'text-success' : avgRpeWeek <= 6 ? 'text-warning' : 'text-danger';

  const trajectoryIcon =
    riskIndicator?.trajectory === 'worsening' ? (
      <TrendingUp className="h-4 w-4 text-danger" />
    ) : riskIndicator?.trajectory === 'improving' ? (
      <TrendingDown className="h-4 w-4 text-success" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-gray-400" />
    );

  return (
    <>
      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Best Score */}
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Best Score
            </span>
          </div>
          <p className="text-2xl font-bold text-black">
            {latestBestScore != null ? latestBestScore : '—'}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {selectedMetric?.name || 'Select a metric'}
          </p>
        </div>

        {/* Avg RPE */}
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
              <Zap className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Avg RPE
            </span>
          </div>
          <p className={cn('text-2xl font-bold', rpeColor)}>{avgRpeWeek || '—'}</p>
          <p className="mt-0.5 text-xs text-gray-400">7-day average</p>
        </div>

        {/* Days Lost */}
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg',
                totalDaysLost > 0 ? 'bg-red-50' : 'bg-gray-50'
              )}
            >
              <HeartPulse
                className={cn('h-3.5 w-3.5', totalDaysLost > 0 ? 'text-danger' : 'text-gray-400')}
              />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Days Lost
            </span>
          </div>
          <p className={cn('text-2xl font-bold', totalDaysLost > 0 ? 'text-danger' : 'text-black')}>
            {totalDaysLost}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">Injury time lost</p>
        </div>

        {/* ACWR — risk-colored card */}
        <div
          className={cn(
            'rounded-xl border p-4',
            riskLevel === 'high'
              ? 'border-danger/30 bg-danger/5'
              : riskLevel === 'moderate'
                ? 'border-warning/30 bg-warning/5'
                : 'border-border bg-white'
          )}
        >
          <div className="mb-3 flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg',
                riskLevel === 'high'
                  ? 'bg-danger/10'
                  : riskLevel === 'moderate'
                    ? 'bg-warning/10'
                    : 'bg-emerald-50'
              )}
            >
              <Activity
                className={cn(
                  'h-3.5 w-3.5',
                  riskLevel === 'high'
                    ? 'text-danger'
                    : riskLevel === 'moderate'
                      ? 'text-warning'
                      : 'text-success'
                )}
              />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              ACWR
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                'text-2xl font-bold',
                riskLevel === 'high'
                  ? 'text-danger'
                  : riskLevel === 'moderate'
                    ? 'text-warning'
                    : 'text-black'
              )}
            >
              {riskIndicator?.acwr ?? '—'}
            </p>
            {riskIndicator && trajectoryIcon}
          </div>
          <p
            className={cn(
              'mt-0.5 text-xs font-medium capitalize',
              riskLevel === 'high'
                ? 'text-danger'
                : riskLevel === 'moderate'
                  ? 'text-warning'
                  : 'text-success'
            )}
          >
            {riskLevel} risk
          </p>
        </div>
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
            <div className="flex flex-col items-center justify-center py-12">
              <Trophy className="mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">No performance data for this metric</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Training Load" subtitle="Last 30 days">
          {loadChartData.length > 0 ? (
            <AnalyticsAreaChart
              data={loadChartData}
              xKey="date"
              areas={[{ key: 'Training Load', color: CHART_BLACK, name: 'Load' }]}
              height={250}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">No load data recorded</p>
            </div>
          )}
        </ChartCard>
      </div>
    </>
  );
}
