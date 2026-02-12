'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChartCard } from '@/components/charts/ChartCard';
import { AnalyticsBarChart } from '@/components/charts/BarChart';
import { AnalyticsRadarChart } from '@/components/charts/RadarChart';
import { AnalyticsLineChart } from '@/components/charts/LineChart';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { CHART_BLACK, CHART_GRAY, CHART_SUCCESS, CHART_DANGER, getChartColor } from '@/components/charts/chartColors';
import { exportToCsv } from '@/lib/utils/csvExport';
import { useToastStore } from '@/components/ui/Toast';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Athlete, Sport, Metric, AthleteRanking, PerformanceTrend } from '@/types';

interface ComparisonsClientProps {
  athletes: Athlete[];
  sports: Sport[];
  sportMetricsMap: Record<string, Metric[]>;
  rankingsMap: Record<string, AthleteRanking[]>;
  heatmapData: Record<string, Record<string, number | null>>;
  performanceTrends?: PerformanceTrend[];
}

export function ComparisonsClient({
  athletes,
  sports,
  sportMetricsMap,
  rankingsMap,
  heatmapData,
  performanceTrends = [],
}: ComparisonsClientProps) {
  const { addToast } = useToastStore();
  const [selectedSportId, setSelectedSportId] = useState(sports[0]?.id || '');
  const [selectedMetricId, setSelectedMetricId] = useState('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);

  const sportMetrics = sportMetricsMap[selectedSportId] || [];

  // Auto-select first metric when sport changes
  const effectiveMetricId = selectedMetricId && sportMetrics.find((m) => m.id === selectedMetricId)
    ? selectedMetricId
    : sportMetrics[0]?.id || '';

  const rankings = rankingsMap[effectiveMetricId] || [];
  const selectedMetric = sportMetrics.find((m) => m.id === effectiveMetricId);

  // Filter athletes by sport
  const sportAthletes = athletes.filter((a) => a.sportId === selectedSportId);

  // Comparison chart data
  const comparisonData = useMemo(() => {
    if (selectedAthleteIds.length === 0) return [];
    return selectedAthleteIds
      .map((id) => {
        const ranking = rankings.find((r) => r.athleteId === id);
        return ranking ? { name: ranking.athleteName, 'Best Score': ranking.bestScore } : null;
      })
      .filter(Boolean) as { name: string; 'Best Score': number }[];
  }, [selectedAthleteIds, rankings]);

  // Radar chart data — normalize scores across metrics for selected athletes
  const radarData = useMemo(() => {
    if (selectedAthleteIds.length === 0 || sportMetrics.length === 0) return [];

    return sportMetrics
      .filter((m) => !m.isDerived)
      .slice(0, 8) // Max 8 axes for readability
      .map((metric) => {
        const point: { metric: string; [key: string]: string | number } = { metric: metric.name };
        const metricRankings = rankingsMap[metric.id] || [];

        // Find max score for normalization
        const maxScore = Math.max(...metricRankings.map((r) => r.bestScore), 1);

        for (const athleteId of selectedAthleteIds) {
          const ranking = metricRankings.find((r) => r.athleteId === athleteId);
          const athlete = athletes.find((a) => a.id === athleteId);
          const key = athlete?.name || athleteId;
          // Normalize to 0-100 scale
          point[key] = ranking ? Math.round((ranking.bestScore / maxScore) * 100) : 0;
        }
        return point;
      });
  }, [selectedAthleteIds, sportMetrics, rankingsMap, athletes]);

  const radarAthletes = useMemo(() => {
    return selectedAthleteIds.map((id, i) => {
      const athlete = athletes.find((a) => a.id === id);
      return {
        key: athlete?.name || id,
        name: athlete?.name || 'Unknown',
        color: getChartColor(i),
      };
    });
  }, [selectedAthleteIds, athletes]);

  // Trend comparison data — show how selected athletes evolved over time for the selected metric
  const trendData = useMemo(() => {
    if (selectedAthleteIds.length === 0 || !effectiveMetricId || performanceTrends.length === 0) return [];

    // Filter trends for selected metric and athletes
    const filteredTrends = performanceTrends.filter(
      (t) => t.metricName === selectedMetric?.name && selectedAthleteIds.some((id) => {
        const athlete = athletes.find((a) => a.id === id);
        return athlete && t.athleteName === athlete.name;
      })
    );

    // Group by date
    const dateMap = new Map<string, Record<string, unknown>>();
    for (const trend of filteredTrends) {
      const dateKey = new Date(trend.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey });
      }
      const point = dateMap.get(dateKey)!;
      point[trend.athleteName || 'Unknown'] = trend.bestScore;
    }

    return Array.from(dateMap.values());
  }, [selectedAthleteIds, effectiveMetricId, selectedMetric, performanceTrends, athletes]);

  const trendLines = useMemo(() => {
    return selectedAthleteIds.map((id, i) => {
      const athlete = athletes.find((a) => a.id === id);
      return {
        key: athlete?.name || id,
        name: athlete?.name || 'Unknown',
        color: getChartColor(i),
      };
    });
  }, [selectedAthleteIds, athletes]);

  // Percentile bands data
  const percentileData = useMemo(() => {
    if (rankings.length < 3) return null;
    const scores = rankings.map((r) => r.bestScore).sort((a, b) => a - b);
    const q1 = scores[Math.floor(scores.length * 0.25)];
    const median = scores[Math.floor(scores.length * 0.5)];
    const q3 = scores[Math.floor(scores.length * 0.75)];
    const min = scores[0];
    const max = scores[scores.length - 1];
    return { min, q1, median, q3, max };
  }, [rankings]);

  function handleExportRankings() {
    if (rankings.length === 0) return;
    const headers = ['Rank', 'Athlete', 'Metric', 'Best Score'];
    const rows = rankings.map((r) => [r.rank, r.athleteName, r.metricName, r.bestScore]);
    const metricLabel = selectedMetric?.name || 'rankings';
    exportToCsv(`${metricLabel.replace(/\s+/g, '_')}_rankings.csv`, headers, rows);
    addToast('Rankings exported successfully', 'success');
  }

  function toggleAthlete(id: string) {
    setSelectedAthleteIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  }

  return (
    <>
      <PageHeader
        title="Comparisons"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics/comparisons' },
          { label: 'Comparisons' },
        ]}
        actions={
          rankings.length > 0 ? (
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportRankings}
            >
              Export Rankings
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <Card padding="sm" className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedSportId}
            onChange={(e) => {
              setSelectedSportId(e.target.value);
              setSelectedMetricId('');
              setSelectedAthleteIds([]);
            }}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm focus:border-black focus:outline-none"
          >
            {sports.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={effectiveMetricId}
            onChange={(e) => setSelectedMetricId(e.target.value)}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm focus:border-black focus:outline-none"
          >
            {sportMetrics.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
            ))}
            {sportMetrics.length === 0 && <option value="">No metrics</option>}
          </select>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ranking Table */}
        <ChartCard title={`Rankings — ${selectedMetric?.name || 'Select metric'}`}>
          {rankings.length > 0 ? (
            <div className="max-h-[350px] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-3 py-2 font-medium text-gray-500">#</th>
                    <th className="px-3 py-2 font-medium text-gray-500">Athlete</th>
                    <th className="px-3 py-2 font-medium text-gray-500 text-right">Best Score</th>
                    <th className="px-3 py-2 font-medium text-gray-500">Compare</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => (
                    <tr key={r.athleteId} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <span className={
                          r.rank <= 3
                            ? 'font-bold text-success'
                            : r.rank > rankings.length - 3
                              ? 'text-danger'
                              : 'text-gray-600'
                        }>
                          {r.rank}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-black">{r.athleteName}</td>
                      <td className="px-3 py-2 text-right text-black">{r.bestScore}</td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedAthleteIds.includes(r.athleteId)}
                          onChange={() => toggleAthlete(r.athleteId)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No ranking data for this metric</p>
          )}
        </ChartCard>

        {/* Comparison Bar Chart */}
        <ChartCard
          title="Comparison"
          subtitle={selectedAthleteIds.length > 0
            ? `${selectedAthleteIds.length} athletes selected`
            : 'Select athletes to compare (max 5)'}
        >
          {comparisonData.length > 0 ? (
            <AnalyticsBarChart
              data={comparisonData}
              xKey="name"
              bars={[{ key: 'Best Score', color: CHART_BLACK, name: selectedMetric?.name || 'Score' }]}
              height={300}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              Check athletes in the ranking table to compare
            </p>
          )}
        </ChartCard>
      </div>

      {/* Radar chart + Percentile bands */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Multi-Metric Radar"
          subtitle={radarData.length > 0 ? 'Normalized scores (0-100 scale)' : 'Select athletes to view radar'}
        >
          {radarData.length > 0 ? (
            <AnalyticsRadarChart
              data={radarData}
              athletes={radarAthletes}
              height={320}
            />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              Select athletes from the ranking table to see multi-metric comparison
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Team Distribution"
          subtitle={percentileData ? `${selectedMetric?.name || 'Metric'} — score distribution` : 'Select a metric'}
        >
          {percentileData ? (
            <div className="flex flex-col items-center justify-center py-6">
              {/* Box plot visualization */}
              <div className="w-full max-w-md px-4">
                <div className="relative h-16">
                  {/* Whisker line */}
                  <div
                    className="absolute top-1/2 h-0.5 bg-gray-300 -translate-y-1/2"
                    style={{
                      left: `${((percentileData.min - percentileData.min) / (percentileData.max - percentileData.min)) * 100}%`,
                      width: `${((percentileData.max - percentileData.min) / (percentileData.max - percentileData.min)) * 100}%`,
                    }}
                  />
                  {/* IQR box */}
                  <div
                    className="absolute top-1/2 h-10 -translate-y-1/2 rounded border-2 border-black bg-black/5"
                    style={{
                      left: `${((percentileData.q1 - percentileData.min) / (percentileData.max - percentileData.min)) * 100}%`,
                      width: `${((percentileData.q3 - percentileData.q1) / (percentileData.max - percentileData.min)) * 100}%`,
                    }}
                  />
                  {/* Median line */}
                  <div
                    className="absolute top-1/2 h-10 w-0.5 bg-black -translate-y-1/2"
                    style={{
                      left: `${((percentileData.median - percentileData.min) / (percentileData.max - percentileData.min)) * 100}%`,
                    }}
                  />
                  {/* Min whisker */}
                  <div className="absolute top-1/2 h-4 w-0.5 bg-gray-300 -translate-y-1/2" style={{ left: '0%' }} />
                  {/* Max whisker */}
                  <div className="absolute top-1/2 h-4 w-0.5 bg-gray-300 -translate-y-1/2" style={{ left: '100%' }} />

                  {/* Selected athlete markers */}
                  {selectedAthleteIds.map((id, i) => {
                    const ranking = rankings.find((r) => r.athleteId === id);
                    if (!ranking) return null;
                    const pos = ((ranking.bestScore - percentileData.min) / (percentileData.max - percentileData.min)) * 100;
                    return (
                      <div
                        key={id}
                        className="absolute -translate-x-1/2"
                        style={{ left: `${Math.max(0, Math.min(100, pos))}%`, top: '-4px' }}
                        title={`${ranking.athleteName}: ${ranking.bestScore}`}
                      >
                        <div
                          className="h-3 w-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: getChartColor(i) }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Labels */}
                <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                  <span>{percentileData.min}</span>
                  <span>Q1: {percentileData.q1}</span>
                  <span>Med: {percentileData.median}</span>
                  <span>Q3: {percentileData.q3}</span>
                  <span>{percentileData.max}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Box shows 25th-75th percentile range. Line = median.
              </p>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              Need at least 3 athletes with scores to show distribution
            </p>
          )}
        </ChartCard>
      </div>

      {/* Trend comparison */}
      {trendData.length > 0 && (
        <div className="mb-6">
          <ChartCard
            title="Score Trend Over Time"
            subtitle={`${selectedMetric?.name || 'Metric'} — best score per session`}
          >
            <AnalyticsLineChart
              data={trendData}
              xKey="date"
              lines={trendLines}
              height={300}
            />
          </ChartCard>
        </div>
      )}

      {/* Performance Heatmap */}
      <PerformanceHeatmap
        athletes={sportAthletes}
        metrics={sportMetrics}
        heatmapData={heatmapData}
      />
    </>
  );
}
