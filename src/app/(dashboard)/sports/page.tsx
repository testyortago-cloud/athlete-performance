import { getSports } from '@/lib/services/sportService';
import { SportsClient } from './SportsClient';

export const dynamic = 'force-dynamic';

export default async function SportsPage() {
  const sports = await getSports();
  return <SportsClient sports={sports} />;
}
