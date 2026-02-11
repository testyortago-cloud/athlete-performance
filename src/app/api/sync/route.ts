import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncAllTables } from '@/lib/services/syncService';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
  }

  try {
    const results = await syncAllTables();
    return NextResponse.json({
      success: true,
      synced: results,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
