'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InteractiveTable } from '@/components/tables/InteractiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { testingColumns } from './TestingTableColumns';
import { exportToCsv } from '@/lib/utils/csvExport';
import { Plus, Download, ClipboardCheck, CalendarDays, Users, TrendingUp } from 'lucide-react';
import type { TestingSession } from '@/types';

interface TestingClientProps {
  sessions: TestingSession[];
  totalAthletes: number;
}

export function TestingClient({ sessions, totalAthletes }: TestingClientProps) {
  const router = useRouter();

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = sessions.filter((s) => new Date(s.date) >= startOfMonth).length;
    const uniqueAthletes = new Set(sessions.map((s) => s.athleteId)).size;
    const avgPerAthlete = uniqueAthletes > 0 ? Math.round((sessions.length / uniqueAthletes) * 10) / 10 : 0;

    // Sessions per month for last 6 months
    const monthlyData: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = sessions.filter((s) => {
        const sd = new Date(s.date);
        return sd >= d && sd <= end;
      }).length;
      monthlyData.push({
        month: d.toLocaleDateString('en-AU', { month: 'short' }),
        count,
      });
    }

    return { thisMonth, uniqueAthletes, avgPerAthlete, monthlyData };
  }, [sessions]);

  const maxMonthly = Math.max(...stats.monthlyData.map((m) => m.count), 1);

  return (
    <>
      <PageHeader
        title="Testing"
        actions={
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <Button
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                onClick={() => {
                  const headers = ['Date', 'Athlete', 'Notes', 'Created By'];
                  const rows = sessions.map((s) => [s.date, s.athleteName ?? '', s.notes, s.createdBy]);
                  exportToCsv('testing_sessions.csv', headers, rows);
                }}
              >
                Export
              </Button>
            )}
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => router.push('/testing/new')}
            >
              New Session
            </Button>
          </div>
        }
      />

      {sessions.length > 0 && (
        <>
          {/* Summary stat cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <ClipboardCheck className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{sessions.length}</p>
                  <p className="text-xs text-gray-500">Total Sessions</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CalendarDays className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{stats.thisMonth}</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">
                    {stats.uniqueAthletes}
                    <span className="ml-1 text-sm font-normal text-gray-400">/ {totalAthletes}</span>
                  </p>
                  <p className="text-xs text-gray-500">Athletes Tested</p>
                </div>
              </div>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{stats.avgPerAthlete}</p>
                  <p className="text-xs text-gray-500">Avg Sessions/Athlete</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Monthly session activity */}
          <Card className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-black">Session Activity (Last 6 Months)</h3>
            <div className="flex items-end gap-2 h-24">
              {stats.monthlyData.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-black">{m.count}</span>
                  <div className="w-full rounded-t bg-gray-100" style={{ height: '72px' }}>
                    <div
                      className="w-full rounded-t bg-black transition-all"
                      style={{ height: `${(m.count / maxMonthly) * 72}px`, marginTop: `${72 - (m.count / maxMonthly) * 72}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{m.month}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          icon="testing"
          title="No testing sessions yet"
          description="Create a testing session to record athlete performance trials and track improvements."
          actionLabel="New Session"
          onAction={() => router.push('/testing/new')}
        />
      ) : (
        <InteractiveTable
          columns={testingColumns}
          data={sessions}
          onRowClick={(session) => router.push(`/testing/${session.id}`)}
          searchPlaceholder="Search sessions..."
        />
      )}
    </>
  );
}
