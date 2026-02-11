import { getAthletes } from './athleteService';
import { getInjuries } from './injuryService';
import { getDailyLoads } from './dailyLoadService';
import { getTestingSessions, getTrialDataBySession } from './testingSessionService';
import { getMetricsBySport } from './metricService';
import type {
  KpiCardData,
  InjurySummary,
  InjuryTypeSummary,
  LoadTrend,
  PerformanceTrend,
  RiskIndicator,
  RiskAlert,
  AthleteRanking,
  Athlete,
  DailyLoad,
  Injury,
  Metric,
  ThresholdSettings,
} from '@/types';
import { DEFAULT_THRESHOLDS } from '@/types/settings';

// --- KPIs ---

export async function getDashboardKpis(): Promise<KpiCardData[]> {
  const [athletes, injuries, dailyLoads, sessions] = await Promise.all([
    getAthletes(),
    getInjuries(),
    getDailyLoads(),
    getTestingSessions(),
  ]);

  const activeAthletes = athletes.filter((a) => a.status === 'active').length;
  const activeInjuries = injuries.filter((i) => i.status === 'active').length;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const recentLoads = dailyLoads.filter((l) => new Date(l.date) >= sevenDaysAgo);
  const avgLoad = recentLoads.length > 0
    ? Math.round(recentLoads.reduce((sum, l) => sum + l.trainingLoad, 0) / recentLoads.length)
    : 0;

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sessionsThisMonth = sessions.filter((s) => new Date(s.date) >= startOfMonth).length;

  return [
    { label: 'Active Athletes', value: activeAthletes, icon: 'users' },
    { label: 'Active Injuries', value: activeInjuries, icon: 'alert-triangle' },
    { label: 'Avg Load (7d)', value: avgLoad, icon: 'activity' },
    { label: 'Sessions This Month', value: sessionsThisMonth, icon: 'clipboard' },
  ];
}

// --- Injury Summaries ---

export function computeInjurySummaryByBodyRegion(injuries: Injury[]): InjurySummary[] {
  const map = new Map<string, { count: number; daysLost: number }>();

  for (const injury of injuries) {
    const region = injury.bodyRegion || 'Unknown';
    const existing = map.get(region) || { count: 0, daysLost: 0 };
    existing.count += 1;
    existing.daysLost += injury.daysLost ?? 0;
    map.set(region, existing);
  }

  return Array.from(map.entries())
    .map(([bodyRegion, data]) => ({ bodyRegion, ...data }))
    .sort((a, b) => b.count - a.count);
}

export function computeInjurySummaryByType(injuries: Injury[]): InjuryTypeSummary[] {
  const map = new Map<string, number>();

  for (const injury of injuries) {
    const type = injury.type || 'injury';
    map.set(type, (map.get(type) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

// --- Load Trends ---

export function computeLoadTrends(
  dailyLoads: DailyLoad[],
  options?: { days?: number }
): LoadTrend[] {
  const days = options?.days ?? 30;
  const cutoff = new Date(Date.now() - days * 86400000);

  const filtered = dailyLoads
    .filter((l) => new Date(l.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Aggregate by date (team avg)
  const dateMap = new Map<string, { totalLoad: number; totalRpe: number; count: number }>();

  for (const load of filtered) {
    const dateKey = load.date.split('T')[0];
    const existing = dateMap.get(dateKey) || { totalLoad: 0, totalRpe: 0, count: 0 };
    existing.totalLoad += load.trainingLoad;
    existing.totalRpe += load.rpe;
    existing.count += 1;
    dateMap.set(dateKey, existing);
  }

  return Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    trainingLoad: Math.round(data.totalLoad / data.count),
    rpe: Math.round((data.totalRpe / data.count) * 10) / 10,
  }));
}

export function computeAthleteLoadTrends(
  dailyLoads: DailyLoad[],
  options?: { days?: number }
): LoadTrend[] {
  const days = options?.days ?? 30;
  const cutoff = new Date(Date.now() - days * 86400000);

  return dailyLoads
    .filter((l) => new Date(l.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((l) => ({
      date: l.date.split('T')[0],
      trainingLoad: l.trainingLoad,
      rpe: l.rpe,
      athleteName: l.athleteName,
    }));
}

// --- Performance Trends ---

export async function getPerformanceTrends(options?: {
  athleteId?: string;
  metricId?: string;
}): Promise<PerformanceTrend[]> {
  const sessions = await getTestingSessions(
    options?.athleteId ? { athleteId: options.athleteId } : undefined
  );

  const trends: PerformanceTrend[] = [];

  for (const session of sessions) {
    const trialData = await getTrialDataBySession(session.id);

    for (const trial of trialData) {
      if (options?.metricId && trial.metricId !== options.metricId) continue;
      if (trial.bestScore == null) continue;

      trends.push({
        date: session.date,
        metricName: trial.metricId, // Will be resolved to name in the page
        bestScore: trial.bestScore,
        averageScore: trial.averageScore ?? trial.bestScore,
        athleteName: session.athleteName,
      });
    }
  }

  return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// --- Risk Indicators (ACWR) ---

export function computeRiskLevel(
  acwr: number,
  thresholds?: Partial<ThresholdSettings>
): 'low' | 'moderate' | 'high' {
  const high = thresholds?.acwrHigh ?? DEFAULT_THRESHOLDS.acwrHigh;
  const moderate = thresholds?.acwrModerate ?? DEFAULT_THRESHOLDS.acwrModerate;
  if (acwr > high) return 'high';
  if (acwr > moderate) return 'moderate';
  return 'low';
}

export function computeAthleteRiskIndicators(
  athletes: Athlete[],
  dailyLoads: DailyLoad[],
  injuries: Injury[],
  thresholds?: Partial<ThresholdSettings>
): RiskIndicator[] {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 86400000);

  return athletes.map((athlete) => {
    const athleteLoads = dailyLoads.filter((l) => l.athleteId === athlete.id);

    // Acute load: sum of last 7 days
    const acuteLoad = athleteLoads
      .filter((l) => new Date(l.date) >= sevenDaysAgo)
      .reduce((sum, l) => sum + l.trainingLoad, 0);

    // Chronic load: average weekly load over last 28 days
    const last28DaysLoads = athleteLoads.filter(
      (l) => new Date(l.date) >= twentyEightDaysAgo
    );
    const totalLoad28 = last28DaysLoads.reduce((sum, l) => sum + l.trainingLoad, 0);
    const chronicLoad = totalLoad28 / 4; // 4 weeks

    // ACWR
    const acwr = chronicLoad > 0 ? Math.round((acuteLoad / chronicLoad) * 100) / 100 : 0;

    // Active injuries for this athlete
    const activeInjuries = injuries.filter(
      (i) => i.athleteId === athlete.id && i.status === 'active'
    ).length;

    return {
      athleteId: athlete.id,
      athleteName: athlete.name,
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: Math.round(chronicLoad),
      acwr,
      riskLevel: computeRiskLevel(acwr, thresholds),
      activeInjuries,
    };
  });
}

export function computeRiskAlerts(
  riskIndicators: RiskIndicator[],
  thresholds?: Partial<ThresholdSettings>
): RiskAlert[] {
  const high = thresholds?.acwrHigh ?? DEFAULT_THRESHOLDS.acwrHigh;
  const moderate = thresholds?.acwrModerate ?? DEFAULT_THRESHOLDS.acwrModerate;
  const alerts: RiskAlert[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const indicator of riskIndicators) {
    if (indicator.acwr > high) {
      alerts.push({
        athleteName: indicator.athleteName,
        message: `ACWR at ${indicator.acwr} — high injury risk`,
        severity: 'danger',
        date: today,
      });
    } else if (indicator.acwr > moderate) {
      alerts.push({
        athleteName: indicator.athleteName,
        message: `ACWR at ${indicator.acwr} — moderate risk, monitor closely`,
        severity: 'warning',
        date: today,
      });
    }
  }

  return alerts.sort((a, b) => (a.severity === 'danger' ? -1 : 1) - (b.severity === 'danger' ? -1 : 1));
}

// --- Athlete Rankings ---

export async function getAthleteRankings(
  metricId: string,
  athletes: Athlete[],
  metricName: string
): Promise<AthleteRanking[]> {
  const sessions = await getTestingSessions();
  const bestScores = new Map<string, number>();

  for (const session of sessions) {
    const trialData = await getTrialDataBySession(session.id);

    for (const trial of trialData) {
      if (trial.metricId !== metricId || trial.bestScore == null) continue;

      const athleteId = session.athleteId;
      const current = bestScores.get(athleteId);
      if (current === undefined || trial.bestScore > current) {
        bestScores.set(athleteId, trial.bestScore);
      }
    }
  }

  const rankings = Array.from(bestScores.entries())
    .map(([athleteId, bestScore]) => {
      const athlete = athletes.find((a) => a.id === athleteId);
      return {
        athleteId,
        athleteName: athlete?.name || 'Unknown',
        metricName,
        bestScore,
        rank: 0,
      };
    })
    .sort((a, b) => b.bestScore - a.bestScore);

  rankings.forEach((r, i) => {
    r.rank = i + 1;
  });

  return rankings;
}

// --- Helper: Get all metrics for a sport ---

export async function getMetricsForSport(sportId: string): Promise<Metric[]> {
  return getMetricsBySport(sportId);
}
