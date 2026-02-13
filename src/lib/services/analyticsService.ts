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
  PersonalRecord,
  WeeklyVolumeSummary,
  WellnessCheckin,
  AchievementBadge,
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
  const activeInjuries = injuries.filter((i) => i.status !== 'resolved').length;

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

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  return athletes.map((athlete) => {
    const athleteLoads = dailyLoads.filter((l) => l.athleteId === athlete.id);

    // Acute load: sum of last 7 days
    const acuteLoad = athleteLoads
      .filter((l) => new Date(l.date) >= sevenDaysAgo)
      .reduce((sum, l) => sum + l.trainingLoad, 0);

    // Previous week acute load: days 8-14
    const prevAcuteLoad = athleteLoads
      .filter((l) => {
        const d = new Date(l.date);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
      })
      .reduce((sum, l) => sum + l.trainingLoad, 0);

    // Chronic load: average weekly load over last 28 days
    const last28DaysLoads = athleteLoads.filter(
      (l) => new Date(l.date) >= twentyEightDaysAgo
    );
    const totalLoad28 = last28DaysLoads.reduce((sum, l) => sum + l.trainingLoad, 0);
    const chronicLoad = totalLoad28 / 4; // 4 weeks

    // ACWR
    const acwr = chronicLoad > 0 ? Math.round((acuteLoad / chronicLoad) * 100) / 100 : 0;

    // Trajectory: compare this week's load to last week's load
    let trajectory: 'improving' | 'stable' | 'worsening' = 'stable';
    if (prevAcuteLoad > 0) {
      const loadChangePercent = ((acuteLoad - prevAcuteLoad) / prevAcuteLoad) * 100;
      if (acwr > 1.3) {
        // When ACWR is high, decreasing load is improving
        trajectory = loadChangePercent < -10 ? 'improving' : loadChangePercent > 10 ? 'worsening' : 'stable';
      } else {
        // When ACWR is in safe range, stable or slight increase is fine
        trajectory = loadChangePercent > 30 ? 'worsening' : loadChangePercent < -20 ? 'improving' : 'stable';
      }
    }

    // Active injuries for this athlete
    const activeInjuries = injuries.filter(
      (i) => i.athleteId === athlete.id && i.status !== 'resolved'
    ).length;

    return {
      athleteId: athlete.id,
      athleteName: athlete.name,
      acuteLoad: Math.round(acuteLoad),
      chronicLoad: Math.round(chronicLoad),
      acwr,
      riskLevel: computeRiskLevel(acwr, thresholds),
      activeInjuries,
      trajectory,
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

// --- Personal Records ---

export function computePersonalRecords(
  performanceTrends: PerformanceTrend[],
  metrics: Metric[]
): PersonalRecord[] {
  const metricMap = new Map(metrics.map((m) => [m.id, m]));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  // Group trends by metricName (which holds metricId from page.tsx)
  const byMetric = new Map<string, PerformanceTrend[]>();
  for (const t of performanceTrends) {
    const arr = byMetric.get(t.metricName) || [];
    arr.push(t);
    byMetric.set(t.metricName, arr);
  }

  const records: PersonalRecord[] = [];

  for (const [metricId, trends] of byMetric) {
    const metric = metricMap.get(metricId);
    if (!metric) continue;

    const isLowest = metric.bestScoreMethod === 'lowest';

    let best: PerformanceTrend | null = null;
    for (const t of trends) {
      if (!best) {
        best = t;
        continue;
      }
      if (isLowest ? t.bestScore < best.bestScore : t.bestScore > best.bestScore) {
        best = t;
      }
    }

    if (best) {
      records.push({
        metricId,
        metricName: metric.name,
        metricUnit: metric.unit,
        prValue: best.bestScore,
        dateAchieved: best.date,
        isRecent: new Date(best.date) >= thirtyDaysAgo,
        bestScoreMethod: metric.bestScoreMethod,
      });
    }
  }

  return records.sort((a, b) => a.metricName.localeCompare(b.metricName));
}

// --- Weekly Volume Summary ---

export function computeWeeklyVolumeSummary(dailyLoads: DailyLoad[]): WeeklyVolumeSummary {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const fourteenDaysAgo = now - 14 * 86400000;

  const currentLoads = dailyLoads.filter((l) => {
    const t = new Date(l.date).getTime();
    return t >= sevenDaysAgo && t <= now;
  });

  const previousLoads = dailyLoads.filter((l) => {
    const t = new Date(l.date).getTime();
    return t >= fourteenDaysAgo && t < sevenDaysAgo;
  });

  const sum = (arr: DailyLoad[], key: 'trainingLoad' | 'rpe') =>
    arr.reduce((s, l) => s + l[key], 0);

  const currentWeek = {
    sessions: currentLoads.length,
    totalLoad: Math.round(sum(currentLoads, 'trainingLoad')),
    avgRpe: currentLoads.length > 0
      ? Math.round((sum(currentLoads, 'rpe') / currentLoads.length) * 10) / 10
      : 0,
  };

  const previousWeek = {
    sessions: previousLoads.length,
    totalLoad: Math.round(sum(previousLoads, 'trainingLoad')),
    avgRpe: previousLoads.length > 0
      ? Math.round((sum(previousLoads, 'rpe') / previousLoads.length) * 10) / 10
      : 0,
  };

  const pctChange = (curr: number, prev: number): number | null => {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    currentWeek,
    previousWeek,
    changes: {
      sessionsPercent: pctChange(currentWeek.sessions, previousWeek.sessions),
      loadPercent: pctChange(currentWeek.totalLoad, previousWeek.totalLoad),
      rpePercent: pctChange(currentWeek.avgRpe, previousWeek.avgRpe),
    },
  };
}

// --- Radar Chart Data (normalized 0-100) ---

export function computeRadarData(
  performanceTrends: PerformanceTrend[],
  metrics: Metric[]
): { metric: string; Current: number; '30 Days Ago': number }[] {
  const metricMap = new Map(metrics.map((m) => [m.id, m]));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  // Group by metric
  const byMetric = new Map<string, PerformanceTrend[]>();
  for (const t of performanceTrends) {
    const arr = byMetric.get(t.metricName) || [];
    arr.push(t);
    byMetric.set(t.metricName, arr);
  }

  const result: { metric: string; Current: number; '30 Days Ago': number }[] = [];

  for (const [metricId, trends] of byMetric) {
    const metric = metricMap.get(metricId);
    if (!metric || trends.length === 0) continue;

    const sorted = [...trends].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get all best scores to compute min/max range for normalization
    const allScores = sorted.map((t) => t.bestScore);
    const min = Math.min(...allScores);
    const max = Math.max(...allScores);
    const range = max - min || 1;

    // Latest score
    const latest = sorted[sorted.length - 1];
    const isLowest = metric.bestScoreMethod === 'lowest';

    // For "lowest is best" metrics, invert the normalization
    const normalize = (val: number) => {
      const raw = ((val - min) / range) * 100;
      return Math.round(isLowest ? 100 - raw : raw);
    };

    const currentNorm = normalize(latest.bestScore);

    // Find the best score from 30+ days ago
    const olderTrends = sorted.filter((t) => new Date(t.date) < thirtyDaysAgo);
    let olderNorm = 0;
    if (olderTrends.length > 0) {
      const olderLatest = olderTrends[olderTrends.length - 1];
      olderNorm = normalize(olderLatest.bestScore);
    }

    result.push({
      metric: metric.name,
      Current: currentNorm,
      '30 Days Ago': olderNorm,
    });
  }

  return result;
}

// --- Training Streak ---

export function computeTrainingStreaks(dailyLoads: DailyLoad[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (dailyLoads.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Get unique training dates sorted descending
  const dates = [...new Set(dailyLoads.map((l) => l.date.split('T')[0]))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const dateSet = new Set(dates);
  const oneDay = 86400000;

  // Current streak: count consecutive days backwards from today
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);

  // Allow gap of 1 day (check today or yesterday to start)
  const todayStr = cursor.toISOString().split('T')[0];
  const yesterdayStr = new Date(cursor.getTime() - oneDay).toISOString().split('T')[0];

  if (dateSet.has(todayStr)) {
    // Start from today
  } else if (dateSet.has(yesterdayStr)) {
    cursor = new Date(cursor.getTime() - oneDay);
  } else {
    // No recent training
    // Still compute longest streak
    currentStreak = 0;
  }

  if (dateSet.has(cursor.toISOString().split('T')[0])) {
    while (dateSet.has(cursor.toISOString().split('T')[0])) {
      currentStreak++;
      cursor = new Date(cursor.getTime() - oneDay);
    }
  }

  // Longest streak: iterate all dates
  let longestStreak = 0;
  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const curr = new Date(dates[i]).getTime();
    const next = new Date(dates[i + 1]).getTime();
    if (curr - next === oneDay) {
      streak++;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  return { currentStreak, longestStreak };
}

// --- Training Load Zones (3.1) ---

export type LoadZone = 'rest' | 'low' | 'optimal' | 'high' | 'danger';

export interface LoadZoneDay {
  date: string;
  trainingLoad: number;
  zone: LoadZone;
}

export interface LoadZoneResult {
  days: LoadZoneDay[];
  dangerStreak: number; // consecutive danger days ending today
}

export function computeLoadZones(dailyLoads: DailyLoad[], options?: { days?: number }): LoadZoneResult {
  const days = options?.days ?? 30;
  const cutoff = new Date(Date.now() - days * 86400000);

  // Use all loads for stats, but only return recent days
  const allLoads = dailyLoads
    .filter((l) => l.trainingLoad > 0)
    .map((l) => l.trainingLoad);

  if (allLoads.length < 3) {
    // Not enough data for meaningful zones
    const recentLoads = dailyLoads
      .filter((l) => new Date(l.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      days: recentLoads.map((l) => ({
        date: l.date.split('T')[0],
        trainingLoad: l.trainingLoad,
        zone: 'optimal' as LoadZone,
      })),
      dangerStreak: 0,
    };
  }

  // Compute rolling mean and standard deviation
  const mean = allLoads.reduce((s, v) => s + v, 0) / allLoads.length;
  const variance = allLoads.reduce((s, v) => s + (v - mean) ** 2, 0) / allLoads.length;
  const stdev = Math.sqrt(variance);

  // Zone thresholds based on mean ± stdev
  const classify = (load: number): LoadZone => {
    if (load === 0) return 'rest';
    if (load < mean - stdev) return 'low';
    if (load <= mean + stdev) return 'optimal';
    if (load <= mean + 2 * stdev) return 'high';
    return 'danger';
  };

  // Aggregate by date (sum if multiple sessions per day)
  const dateMap = new Map<string, number>();
  for (const l of dailyLoads) {
    const d = l.date.split('T')[0];
    dateMap.set(d, (dateMap.get(d) || 0) + l.trainingLoad);
  }

  // Generate all dates in range, fill with 0 for rest days
  const result: LoadZoneDay[] = [];
  const cursor = new Date(cutoff);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  while (cursor <= today) {
    const dateStr = cursor.toISOString().split('T')[0];
    const load = dateMap.get(dateStr) || 0;
    result.push({ date: dateStr, trainingLoad: load, zone: classify(load) });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Compute danger streak from the end
  let dangerStreak = 0;
  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i].zone === 'danger') {
      dangerStreak++;
    } else {
      break;
    }
  }

  return { days: result, dangerStreak };
}

// --- Week-over-Week Comparison with Readiness (3.2) ---

export interface WeekOverWeek {
  currentWeek: { sessions: number; totalLoad: number; avgRpe: number; avgReadiness: number | null };
  previousWeek: { sessions: number; totalLoad: number; avgRpe: number; avgReadiness: number | null };
  changes: {
    sessionsPercent: number | null;
    loadPercent: number | null;
    rpePercent: number | null;
    readinessPercent: number | null;
  };
  loadSpikeAlert: boolean;
}

export function computeWeekOverWeek(
  dailyLoads: DailyLoad[],
  wellnessCheckins: WellnessCheckin[]
): WeekOverWeek {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const fourteenDaysAgo = now - 14 * 86400000;

  const currentLoads = dailyLoads.filter((l) => {
    const t = new Date(l.date).getTime();
    return t >= sevenDaysAgo && t <= now;
  });
  const previousLoads = dailyLoads.filter((l) => {
    const t = new Date(l.date).getTime();
    return t >= fourteenDaysAgo && t < sevenDaysAgo;
  });

  const sum = (arr: DailyLoad[], key: 'trainingLoad' | 'rpe') =>
    arr.reduce((s, l) => s + l[key], 0);

  const currentTotalLoad = Math.round(sum(currentLoads, 'trainingLoad'));
  const previousTotalLoad = Math.round(sum(previousLoads, 'trainingLoad'));

  // Readiness from wellness
  const currentWellness = wellnessCheckins.filter((w) => {
    const t = new Date(w.date).getTime();
    return t >= sevenDaysAgo && t <= now;
  });
  const previousWellness = wellnessCheckins.filter((w) => {
    const t = new Date(w.date).getTime();
    return t >= fourteenDaysAgo && t < sevenDaysAgo;
  });

  const avgReadiness = (arr: WellnessCheckin[]) =>
    arr.length > 0
      ? Math.round((arr.reduce((s, w) => s + w.readinessScore, 0) / arr.length) * 10) / 10
      : null;

  const currentWeek = {
    sessions: currentLoads.length,
    totalLoad: currentTotalLoad,
    avgRpe: currentLoads.length > 0
      ? Math.round((sum(currentLoads, 'rpe') / currentLoads.length) * 10) / 10
      : 0,
    avgReadiness: avgReadiness(currentWellness),
  };

  const previousWeek = {
    sessions: previousLoads.length,
    totalLoad: previousTotalLoad,
    avgRpe: previousLoads.length > 0
      ? Math.round((sum(previousLoads, 'rpe') / previousLoads.length) * 10) / 10
      : 0,
    avgReadiness: avgReadiness(previousWellness),
  };

  const pctChange = (curr: number, prev: number): number | null => {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const loadChangePercent = pctChange(currentTotalLoad, previousTotalLoad);

  return {
    currentWeek,
    previousWeek,
    changes: {
      sessionsPercent: pctChange(currentWeek.sessions, previousWeek.sessions),
      loadPercent: loadChangePercent,
      rpePercent: pctChange(currentWeek.avgRpe, previousWeek.avgRpe),
      readinessPercent:
        currentWeek.avgReadiness != null && previousWeek.avgReadiness != null
          ? pctChange(currentWeek.avgReadiness, previousWeek.avgReadiness)
          : null,
    },
    loadSpikeAlert: loadChangePercent !== null && loadChangePercent > 30,
  };
}

// --- Compliance Rate (3.3) ---

export interface ComplianceRate {
  weeklyTarget: number;
  weeklyActual: number;
  weeklyPercent: number;
  monthlyTarget: number;
  monthlyActual: number;
  monthlyPercent: number;
}

export function computeComplianceRate(
  dailyLoads: DailyLoad[],
  sessionsPerWeek: number = 5
): ComplianceRate {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const thirtyDaysAgo = now - 30 * 86400000;

  const weeklyActual = dailyLoads.filter((l) => {
    const t = new Date(l.date).getTime();
    return t >= sevenDaysAgo && t <= now;
  }).length;

  const monthlyActual = dailyLoads.filter((l) => {
    const t = new Date(l.date).getTime();
    return t >= thirtyDaysAgo && t <= now;
  }).length;

  const monthlyWeeks = 30 / 7;
  const monthlyTarget = Math.round(sessionsPerWeek * monthlyWeeks);

  return {
    weeklyTarget: sessionsPerWeek,
    weeklyActual,
    weeklyPercent: sessionsPerWeek > 0
      ? Math.min(100, Math.round((weeklyActual / sessionsPerWeek) * 100))
      : 0,
    monthlyTarget,
    monthlyActual,
    monthlyPercent: monthlyTarget > 0
      ? Math.min(100, Math.round((monthlyActual / monthlyTarget) * 100))
      : 0,
  };
}

// --- Injury Risk Flags (3.4) ---

export interface RiskFlag {
  id: string;
  type: 'acwr' | 'fatigue' | 'overtraining' | 'recovery';
  severity: 'warning' | 'danger';
  title: string;
  message: string;
}

export function computeRiskFlags(
  riskIndicator: RiskIndicator | null,
  wellnessCheckins: WellnessCheckin[],
  dailyLoads: DailyLoad[]
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Rule 1: ACWR > 1.5 → High workload spike risk
  if (riskIndicator && riskIndicator.acwr > 1.5) {
    flags.push({
      id: 'acwr-high',
      type: 'acwr',
      severity: 'danger',
      title: 'High Workload Spike Risk',
      message: `ACWR is ${riskIndicator.acwr} (threshold: 1.5). Consider reducing training load to allow recovery.`,
    });
  } else if (riskIndicator && riskIndicator.acwr > 1.3) {
    flags.push({
      id: 'acwr-moderate',
      type: 'acwr',
      severity: 'warning',
      title: 'Elevated Workload Ratio',
      message: `ACWR is ${riskIndicator.acwr} (approaching 1.5 threshold). Monitor load carefully.`,
    });
  }

  // Rule 2: Readiness score < 40 for 3+ days → Fatigue risk
  const recentWellness = [...wellnessCheckins]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  let consecutiveLowReadiness = 0;
  for (const w of recentWellness) {
    if (w.readinessScore < 40) {
      consecutiveLowReadiness++;
    } else {
      break;
    }
  }

  if (consecutiveLowReadiness >= 3) {
    flags.push({
      id: 'fatigue-risk',
      type: 'fatigue',
      severity: 'danger',
      title: 'Fatigue Risk — Low Readiness',
      message: `Readiness score below 40 for ${consecutiveLowReadiness} consecutive days. Athlete may need rest or recovery intervention.`,
    });
  }

  // Rule 3: Load increase > 30% week-over-week → Overtraining risk
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const fourteenDaysAgo = now - 14 * 86400000;

  const currentWeekLoad = dailyLoads
    .filter((l) => new Date(l.date).getTime() >= sevenDaysAgo)
    .reduce((s, l) => s + l.trainingLoad, 0);
  const prevWeekLoad = dailyLoads
    .filter((l) => {
      const t = new Date(l.date).getTime();
      return t >= fourteenDaysAgo && t < sevenDaysAgo;
    })
    .reduce((s, l) => s + l.trainingLoad, 0);

  if (prevWeekLoad > 0) {
    const loadIncrease = ((currentWeekLoad - prevWeekLoad) / prevWeekLoad) * 100;
    if (loadIncrease > 30) {
      flags.push({
        id: 'overtraining-risk',
        type: 'overtraining',
        severity: 'warning',
        title: 'Overtraining Risk — Load Spike',
        message: `Training load increased ${Math.round(loadIncrease)}% vs last week (threshold: 30%). Gradual progression recommended.`,
      });
    }
  }

  // Rule 4: RPE > 8 for 3+ consecutive sessions → Recovery concern
  const recentLoads = [...dailyLoads]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  let consecutiveHighRpe = 0;
  for (const l of recentLoads) {
    if (l.rpe > 8) {
      consecutiveHighRpe++;
    } else {
      break;
    }
  }

  if (consecutiveHighRpe >= 3) {
    flags.push({
      id: 'recovery-concern',
      type: 'recovery',
      severity: 'warning',
      title: 'Recovery Concern — High RPE Streak',
      message: `RPE above 8 for ${consecutiveHighRpe} consecutive sessions. Consider scheduling recovery or deload.`,
    });
  }

  return flags;
}

// --- Achievement Badges ---

export function computeAchievementBadges(
  dailyLoads: DailyLoad[],
  personalRecords: PersonalRecord[],
  wellnessCheckins: WellnessCheckin[],
  compliance: ComplianceRate,
  trainingStreaks: { currentStreak: number; longestStreak: number },
): AchievementBadge[] {
  const now = new Date();
  const badges: AchievementBadge[] = [];

  // 1. Iron Streak — 30 consecutive training days
  const streakTarget = 30;
  const streakProgress = Math.min(trainingStreaks.longestStreak, streakTarget);
  badges.push({
    id: 'iron-streak',
    name: 'Iron Streak',
    description: '30 consecutive training days',
    icon: 'flame',
    earnedDate: streakProgress >= streakTarget
      ? now.toISOString().split('T')[0]
      : null,
    progress: streakProgress,
    target: streakTarget,
    earned: streakProgress >= streakTarget,
  });

  // 2. PR Machine — 3 PRs in the last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const recentPRs = personalRecords.filter((pr) => {
    if (!pr.dateAchieved) return false;
    return new Date(pr.dateAchieved) >= thirtyDaysAgo;
  });
  const prTarget = 3;
  badges.push({
    id: 'pr-machine',
    name: 'PR Machine',
    description: '3 personal records in one month',
    icon: 'trophy',
    earnedDate: recentPRs.length >= prTarget
      ? now.toISOString().split('T')[0]
      : null,
    progress: Math.min(recentPRs.length, prTarget),
    target: prTarget,
    earned: recentPRs.length >= prTarget,
  });

  // 3. Recovery Pro — Readiness score > 80 for 14 consecutive days
  const recoveryTarget = 14;
  let maxConsecutiveHigh = 0;
  let currentConsecutive = 0;
  const sortedCheckins = [...wellnessCheckins]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const c of sortedCheckins) {
    if (c.readinessScore > 80) {
      currentConsecutive++;
      maxConsecutiveHigh = Math.max(maxConsecutiveHigh, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }
  badges.push({
    id: 'recovery-pro',
    name: 'Recovery Pro',
    description: 'Readiness score above 80 for 14 consecutive days',
    icon: 'heart',
    earnedDate: maxConsecutiveHigh >= recoveryTarget
      ? now.toISOString().split('T')[0]
      : null,
    progress: Math.min(maxConsecutiveHigh, recoveryTarget),
    target: recoveryTarget,
    earned: maxConsecutiveHigh >= recoveryTarget,
  });

  // 4. Consistent — 90%+ monthly compliance
  const consistentTarget = 90;
  const monthlyCompliance = compliance.monthlyPercent;
  badges.push({
    id: 'consistent',
    name: 'Consistent',
    description: '90%+ compliance for a month',
    icon: 'target',
    earnedDate: monthlyCompliance >= consistentTarget
      ? now.toISOString().split('T')[0]
      : null,
    progress: Math.min(Math.round(monthlyCompliance), consistentTarget),
    target: consistentTarget,
    earned: monthlyCompliance >= consistentTarget,
  });

  // 5. Century Club — 100 training sessions total
  const centuryTarget = 100;
  badges.push({
    id: 'century-club',
    name: 'Century Club',
    description: '100 total training sessions',
    icon: 'zap',
    earnedDate: dailyLoads.length >= centuryTarget
      ? now.toISOString().split('T')[0]
      : null,
    progress: Math.min(dailyLoads.length, centuryTarget),
    target: centuryTarget,
    earned: dailyLoads.length >= centuryTarget,
  });

  return badges;
}

// --- Helper: Get all metrics for a sport ---

export async function getMetricsForSport(sportId: string): Promise<Metric[]> {
  return getMetricsBySport(sportId);
}
