import { auth } from '@/lib/auth';
import { getAthletes } from '@/lib/services/athleteService';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json([], { status: 401 });
  }

  const athletes = await getAthletes();
  const data = athletes.map((a) => ({
    id: a.id,
    name: a.name,
    sportName: a.sportName || '',
  }));

  return NextResponse.json(data);
}
