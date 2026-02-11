import { getInjuries } from '@/lib/services/injuryService';
import { getAthletes } from '@/lib/services/athleteService';
import { InjuriesClient } from './InjuriesClient';

export const dynamic = 'force-dynamic';

export default async function InjuriesPage() {
  const [injuries, athletes] = await Promise.all([getInjuries(), getAthletes()]);

  const athleteMap = new Map(athletes.map((a) => [a.id, a.name]));
  const enrichedInjuries = injuries.map((i) => ({
    ...i,
    athleteName: athleteMap.get(i.athleteId) || 'Unknown',
  }));

  return <InjuriesClient injuries={enrichedInjuries} athletes={athletes} />;
}
