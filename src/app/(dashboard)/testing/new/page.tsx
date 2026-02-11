import { getAthletes } from '@/lib/services/athleteService';
import { NewSessionClient } from './NewSessionClient';

export const dynamic = 'force-dynamic';

export default async function NewSessionPage() {
  const athletes = await getAthletes({ status: 'active' });

  return <NewSessionClient athletes={athletes} />;
}
