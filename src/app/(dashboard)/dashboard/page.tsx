import { Suspense } from 'react';
import { getAthletes } from '@/lib/services/athleteService';
import { getSports } from '@/lib/services/sportService';
import { getInjuries } from '@/lib/services/injuryService';
import { getDailyLoads } from '@/lib/services/dailyLoadService';
import { getTestingSessions } from '@/lib/services/testingSessionService';
import { getThresholdSettings } from '@/lib/services/settingsService';
import {
  computeInjurySummaryByBodyRegion,
  computeInjurySummaryByType,
  computeLoadTrends,
  computeAthleteRiskIndicators,
  computeRiskAlerts,
} from '@/lib/services/analyticsService';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [athletes, sports, injuries, dailyLoads, sessions, thresholds] = await Promise.all([
    getAthletes().catch(() => []),
    getSports().catch(() => []),
    getInjuries().catch(() => []),
    getDailyLoads().catch(() => []),
    getTestingSessions().catch(() => []),
    getThresholdSettings(),
  ]);

  // KPIs
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

  // Chart data
  const injuryByRegion = computeInjurySummaryByBodyRegion(injuries).slice(0, 5);
  const injuryByType = computeInjurySummaryByType(injuries);
  const loadTrends = computeLoadTrends(dailyLoads, { days: 30 });
  const riskIndicators = computeAthleteRiskIndicators(athletes, dailyLoads, injuries, thresholds);
  const alerts = computeRiskAlerts(riskIndicators, thresholds);

  return (
    <Suspense>
      <DashboardClient
        kpis={{
          activeAthletes,
          activeInjuries,
          avgLoad,
          sessionsThisMonth,
        }}
        injuryByRegion={injuryByRegion}
        injuryByType={injuryByType}
        loadTrends={loadTrends}
        riskIndicators={riskIndicators}
        alerts={alerts}
        athletes={athletes}
        sports={sports}
      />
    </Suspense>
  );
}
