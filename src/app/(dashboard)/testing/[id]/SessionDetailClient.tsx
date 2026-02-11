'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { saveTrialDataAction, updateSessionAction, deleteSessionAction } from '../actions';
import { Save, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { TestingSession, Athlete, CategoryWithMetrics } from '@/types';

interface SessionDetailClientProps {
  session: TestingSession;
  athlete: Athlete;
  athletes: Athlete[];
  categoriesWithMetrics: CategoryWithMetrics[];
}

interface TrialState {
  trial1: number | null;
  trial2: number | null;
  trial3: number | null;
  bestScore: number | null;
  averageScore: number | null;
  existingId?: string;
}

function computeBestScore(
  trials: (number | null)[],
  method: 'highest' | 'lowest',
): number | null {
  const valid = trials.filter((t): t is number => t != null);
  if (valid.length === 0) return null;
  return method === 'highest' ? Math.max(...valid) : Math.min(...valid);
}

function computeAverage(trials: (number | null)[]): number | null {
  const valid = trials.filter((t): t is number => t != null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
}

export function SessionDetailClient({
  session,
  athlete,
  athletes,
  categoriesWithMetrics,
}: SessionDetailClientProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Initialize trial state from server data
  const [trialState, setTrialState] = useState<Record<string, TrialState>>(() => {
    const initial: Record<string, TrialState> = {};
    for (const cat of categoriesWithMetrics) {
      for (const mwt of cat.metrics) {
        if (!mwt.metric.isDerived) {
          initial[mwt.metric.id] = {
            trial1: mwt.trial1,
            trial2: mwt.trial2,
            trial3: mwt.trial3,
            bestScore: mwt.bestScore,
            averageScore: mwt.averageScore,
            existingId: mwt.existingTrialDataId,
          };
        }
      }
    }
    return initial;
  });

  const updateTrial = useCallback(
    (metricId: string, field: 'trial1' | 'trial2' | 'trial3', value: number | null, bestScoreMethod: 'highest' | 'lowest') => {
      setTrialState((prev) => {
        const current = prev[metricId] || { trial1: null, trial2: null, trial3: null, bestScore: null, averageScore: null };
        const updated = { ...current, [field]: value };
        const trials = [updated.trial1, updated.trial2, updated.trial3];
        updated.bestScore = computeBestScore(trials, bestScoreMethod);
        updated.averageScore = computeAverage(trials);
        return { ...prev, [metricId]: updated };
      });
    },
    [],
  );

  async function handleSaveAll() {
    setSaving(true);
    setSaveMessage('');

    const trials = Object.entries(trialState).map(([metricId, state]) => ({
      metricId,
      trial1: state.trial1,
      trial2: state.trial2,
      trial3: state.trial3,
      bestScore: state.bestScore,
      averageScore: state.averageScore,
      existingId: state.existingId,
    }));

    const result = await saveTrialDataAction(session.id, JSON.stringify(trials));

    if (result.success) {
      setSaveMessage('Trial data saved successfully');
      router.refresh();
    } else {
      setSaveMessage(result.error || 'Failed to save');
    }

    setSaving(false);
    setTimeout(() => setSaveMessage(''), 3000);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteSessionAction(session.id);
    if (result.success) {
      router.push('/testing');
      router.refresh();
    }
    setDeleting(false);
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateSessionAction(session.id, formData);
      if (result.error) {
        setEditError(result.error);
      } else {
        setShowEditModal(false);
        router.refresh();
      }
    } catch {
      setEditError('An unexpected error occurred');
    } finally {
      setEditLoading(false);
    }
  }

  const formattedDate = session.date
    ? new Date(session.date).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const athleteOptions = athletes
    .filter((a) => a.status === 'active')
    .map((a) => ({ label: a.name, value: a.id }));

  return (
    <>
      <PageHeader
        title={`${session.athleteName} - ${formattedDate}`}
        breadcrumbs={[
          { label: 'Testing', href: '/testing' },
          { label: `${session.athleteName} - ${formattedDate}` },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              icon={<Save className="h-4 w-4" />}
              onClick={handleSaveAll}
              loading={saving}
            >
              Save All
            </Button>
            <Button
              variant="secondary"
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => setShowEditModal(true)}
            >
              Edit Session
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

      {saveMessage && (
        <div className={`mb-4 rounded-md px-4 py-3 text-sm ${
          saveMessage.includes('success')
            ? 'bg-success/10 text-success'
            : 'bg-danger/10 text-danger'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Session info collapsible */}
      <Card className="mb-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setShowSessionInfo(!showSessionInfo)}
        >
          <h3 className="text-lg font-semibold text-black">Session Info</h3>
          {showSessionInfo ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        {showSessionInfo && (
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Athlete</dt>
              <dd className="text-sm font-medium text-black">{session.athleteName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Sport</dt>
              <dd className="text-sm font-medium text-black">{athlete.sportName || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Date</dt>
              <dd className="text-sm font-medium text-black">{formattedDate}</dd>
            </div>
            {session.notes && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Notes</dt>
                <dd className="text-sm font-medium text-black">{session.notes}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Created By</dt>
              <dd className="text-sm font-medium text-black">{session.createdBy || '—'}</dd>
            </div>
          </dl>
        )}
      </Card>

      {/* Trial data grid by category */}
      {categoriesWithMetrics.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-gray-500">
            No metrics configured for this athlete&apos;s sport. Add metrics in the Metrics settings.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {categoriesWithMetrics.map(({ category, metrics: categoryMetrics }) => (
            <Card key={category.id} padding="none">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-black">{category.name}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Metric</th>
                      <th className="px-3 py-3 text-left font-medium text-gray-500">Unit</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-500">Trial 1</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-500">Trial 2</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-500">Trial 3</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-500">Best</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-500">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryMetrics.map((mwt) => {
                      const { metric } = mwt;
                      const state = trialState[metric.id];

                      if (metric.isDerived) {
                        return (
                          <tr key={metric.id} className="border-b border-gray-100 bg-gray-50/50">
                            <td className="px-6 py-3 font-medium text-gray-500">
                              {metric.name}
                              <span className="ml-2 text-xs text-gray-400">(derived)</span>
                            </td>
                            <td className="px-3 py-3 text-gray-400">{metric.unit}</td>
                            <td colSpan={5} className="px-3 py-3 text-center text-xs text-gray-400">
                              Formula: {metric.formula || 'Not configured'}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={metric.id} className="border-b border-gray-100">
                          <td className="px-6 py-3 font-medium text-black">{metric.name}</td>
                          <td className="px-3 py-3 text-gray-500">{metric.unit}</td>
                          {[1, 2, 3].map((trialNum) => {
                            const show = trialNum <= metric.trialCount;
                            const field = `trial${trialNum}` as 'trial1' | 'trial2' | 'trial3';
                            return (
                              <td key={trialNum} className="px-3 py-2 text-center">
                                {show ? (
                                  <input
                                    type="number"
                                    step="any"
                                    className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={state?.[field] ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? null : Number(e.target.value);
                                      updateTrial(metric.id, field, val, metric.bestScoreMethod);
                                    }}
                                  />
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center">
                            {state?.bestScore != null ? (
                              <Badge variant="success">{state.bestScore}</Badge>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-medium text-gray-600">
                            {state?.averageScore != null ? state.averageScore : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit session modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Session">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
              {editError}
            </div>
          )}
          <Select
            id="athleteId"
            name="athleteId"
            label="Athlete"
            options={athleteOptions}
            defaultValue={session.athleteId}
            required
          />
          <Input
            id="date"
            name="date"
            label="Date"
            type="date"
            defaultValue={session.date}
            required
          />
          <Input
            id="notes"
            name="notes"
            label="Notes"
            defaultValue={session.notes}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" loading={editLoading}>
              Update Session
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Session"
        message={`Are you sure you want to delete this testing session for ${session.athleteName}? All trial data will also be lost. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
