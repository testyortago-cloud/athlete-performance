import { getTestingSessions } from '@/lib/services/testingSessionService';
import { getAthletes } from '@/lib/services/athleteService';
import { TestingClient } from './TestingClient';

export const dynamic = 'force-dynamic';

export default async function TestingPage() {
  const [sessions, athletes] = await Promise.all([getTestingSessions(), getAthletes()]);

  const athleteMap = new Map(athletes.map((a) => [a.id, a.name]));
  const enrichedSessions = sessions.map((s) => ({
    ...s,
    athleteName: athleteMap.get(s.athleteId) || 'Unknown',
  }));

  return <TestingClient sessions={enrichedSessions} />;
}
