import { Suspense } from 'react';
import { getAthletes } from '@/lib/services/athleteService';
import { getDailyLoads } from '@/lib/services/dailyLoadService';
import { getInjuries } from '@/lib/services/injuryService';
import { getThresholdSettings } from '@/lib/services/settingsService';
import {
  computeAthleteRiskIndicators,
  computeLoadTrends,
  computeRiskAlerts,
} from '@/lib/services/analyticsService';
import { RiskClient } from './RiskClient';

export const dynamic = 'force-dynamic';

export default async function RiskPage() {
  const [athletes, dailyLoads, injuries, thresholds] = await Promise.all([
    getAthletes(),
    getDailyLoads(),
    getInjuries(),
    getThresholdSettings(),
  ]);

  const riskIndicators = computeAthleteRiskIndicators(athletes, dailyLoads, injuries, thresholds);
  const loadTrends = computeLoadTrends(dailyLoads, { days: 28 });
  const alerts = computeRiskAlerts(riskIndicators, thresholds);

  // KPIs
  const highRiskCount = riskIndicators.filter((r) => r.riskLevel === 'high').length;
  const moderateRiskCount = riskIndicators.filter((r) => r.riskLevel === 'moderate').length;
  const avgAcwr = riskIndicators.length > 0
    ? Math.round((riskIndicators.reduce((sum, r) => sum + r.acwr, 0) / riskIndicators.length) * 100) / 100
    : 0;

  return (
    <Suspense>
      <RiskClient
        riskIndicators={riskIndicators}
        loadTrends={loadTrends}
        alerts={alerts}
        highRiskCount={highRiskCount}
        moderateRiskCount={moderateRiskCount}
        avgAcwr={avgAcwr}
        acwrModerate={thresholds.acwrModerate}
        acwrHigh={thresholds.acwrHigh}
      />
    </Suspense>
  );
}
