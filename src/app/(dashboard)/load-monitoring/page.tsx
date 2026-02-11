import { getDailyLoads } from '@/lib/services/dailyLoadService';
import { getAthletes } from '@/lib/services/athleteService';
import { LoadMonitoringClient } from './LoadMonitoringClient';

export const dynamic = 'force-dynamic';

export default async function LoadMonitoringPage() {
  const [loads, athletes] = await Promise.all([getDailyLoads(), getAthletes()]);

  const athleteMap = new Map(athletes.map((a) => [a.id, a.name]));
  const enrichedLoads = loads.map((l) => ({
    ...l,
    athleteName: athleteMap.get(l.athleteId) || 'Unknown',
  }));

  return <LoadMonitoringClient loads={enrichedLoads} athletes={athletes} />;
}
