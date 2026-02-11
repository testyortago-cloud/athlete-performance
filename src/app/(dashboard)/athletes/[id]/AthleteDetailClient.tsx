'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { AthleteForm } from '../AthleteForm';
import { deleteAthleteAction } from '../actions';
import { AthleteAnalytics } from './AthleteAnalytics';
import { Pencil, Trash2, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/utils/csvExport';
import { useToastStore } from '@/components/ui/Toast';
import type { Athlete, Sport, TrainingProgram, Injury, DailyLoad, TestingSession, Metric, PerformanceTrend, LoadTrend, RiskIndicator } from '@/types';

interface AthleteDetailClientProps {
  athlete: Athlete;
  sports: Sport[];
  programs: TrainingProgram[];
  injuries: Injury[];
  dailyLoads: DailyLoad[];
  testingSessions: TestingSession[];
  metrics: Metric[];
  performanceTrends: PerformanceTrend[];
  loadTrends: LoadTrend[];
  riskIndicator: RiskIndicator | null;
  avgRpeWeek: number;
  totalDaysLost: number;
}

export function AthleteDetailClient({
  athlete,
  sports,
  programs,
  injuries,
  dailyLoads,
  testingSessions,
  metrics,
  performanceTrends,
  loadTrends,
  riskIndicator,
  avgRpeWeek,
  totalDaysLost,
}: AthleteDetailClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleExportCsv() {
    const headers = ['Date', 'Metric', 'Best Score', 'Average Score'];
    const rows = performanceTrends.map((t) => {
      const metric = metrics.find((m) => m.id === t.metricName);
      return [t.date, metric?.name || t.metricName, t.bestScore, t.averageScore];
    });
    exportToCsv(`${athlete.name.replace(/\s+/g, '_')}_performance.csv`, headers, rows);
    addToast('CSV exported successfully', 'success');
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAthleteAction(athlete.id);
    if (result.success) {
      router.push('/athletes');
      router.refresh();
    }
    setDeleting(false);
  }

  const dob = athlete.dateOfBirth
    ? new Date(athlete.dateOfBirth).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  return (
    <>
      <PageHeader
        title={athlete.name}
        breadcrumbs={[
          { label: 'Athletes', href: '/athletes' },
          { label: athlete.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-4">
        <Avatar
          src={athlete.photo?.thumbnails?.large?.url ?? athlete.photo?.url}
          name={athlete.name}
          size="lg"
        />
        <div>
          <h2 className="text-xl font-bold text-black">{athlete.name}</h2>
          <p className="text-sm text-gray-500">
            {[athlete.sportName, athlete.position].filter(Boolean).join(' \u00B7 ') || 'No sport assigned'}
          </p>
        </div>
      </div>

      {/* Analytics Section */}
      <AthleteAnalytics
        metrics={metrics}
        performanceTrends={performanceTrends}
        loadTrends={loadTrends}
        riskIndicator={riskIndicator}
        avgRpeWeek={avgRpeWeek}
        totalDaysLost={totalDaysLost}
      />

      {/* Details + Injuries + Load Lists */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">Details</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Sport</dt>
              <dd className="text-sm font-medium text-black">{athlete.sportName || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Program</dt>
              <dd className="text-sm font-medium text-black">{athlete.programName || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Position</dt>
              <dd className="text-sm font-medium text-black">{athlete.position || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Date of Birth</dt>
              <dd className="text-sm font-medium text-black">{dob}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <Badge variant={athlete.status === 'active' ? 'success' : 'default'}>
                  {athlete.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">Performance</h3>
          {testingSessions.length === 0 ? (
            <p className="text-sm text-gray-500">No testing sessions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {testingSessions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => router.push(`/testing/${s.id}`)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-black">
                    {new Date(s.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-gray-500">{s.notes || 'No notes'}</span>
                </button>
              ))}
              {testingSessions.length > 5 && (
                <p className="pt-1 text-center text-xs text-gray-400">
                  +{testingSessions.length - 5} more sessions
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black">Injuries</h3>
            {injuries.filter((i) => i.status === 'active').length > 0 && (
              <Badge variant="danger">
                {injuries.filter((i) => i.status === 'active').length} active
              </Badge>
            )}
          </div>
          {injuries.length === 0 ? (
            <p className="text-sm text-gray-500">No injuries recorded.</p>
          ) : (
            <div className="space-y-2">
              {injuries.slice(0, 5).map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => router.push(`/injuries/${i.id}`)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={i.status === 'active' ? 'danger' : 'success'} >
                      {i.status === 'active' ? 'Active' : 'Resolved'}
                    </Badge>
                    <span className="font-medium text-black">{i.bodyRegion}</span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(i.dateOccurred).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-black">Training Load</h3>
          {dailyLoads.length === 0 ? (
            <p className="text-sm text-gray-500">No load entries recorded.</p>
          ) : (
            <div className="space-y-2">
              {dailyLoads.slice(0, 7).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => router.push(`/load-monitoring/${l.id}`)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="text-gray-500">
                    {new Date(l.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
                  </span>
                  <div className="flex items-center gap-3">
                    <Badge variant={l.rpe <= 3 ? 'success' : l.rpe <= 6 ? 'warning' : 'danger'}>
                      RPE {l.rpe}
                    </Badge>
                    <span className="font-medium text-black">{l.trainingLoad}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Athlete">
        <AthleteForm
          athlete={athlete}
          sports={sports}
          programs={programs}
          onSuccess={() => setShowEditModal(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Athlete"
        message={`Are you sure you want to delete ${athlete.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
