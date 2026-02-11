'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChartCard } from '@/components/charts/ChartCard';
import { AnalyticsBarChart } from '@/components/charts/BarChart';
import { PerformanceHeatmap } from './PerformanceHeatmap';
import { CHART_BLACK, CHART_GRAY, CHART_SUCCESS, CHART_DANGER, getChartColor } from '@/components/charts/chartColors';
import { exportToCsv } from '@/lib/utils/csvExport';
import { useToastStore } from '@/components/ui/Toast';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Athlete, Sport, Metric, AthleteRanking } from '@/types';

interface ComparisonsClientProps {
  athletes: Athlete[];
  sports: Sport[];
  sportMetricsMap: Record<string, Metric[]>;
  rankingsMap: Record<string, AthleteRanking[]>;
  heatmapData: Record<string, Record<string, number | null>>;
}

export function ComparisonsClient({
  athletes,
  sports,
  sportMetricsMap,
  rankingsMap,
  heatmapData,
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

      {/* Performance Heatmap */}
      <PerformanceHeatmap
        athletes={sportAthletes}
        metrics={sportMetrics}
        heatmapData={heatmapData}
      />
    </>
  );
}
