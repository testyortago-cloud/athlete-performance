'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { useToastStore } from '@/stores/toastStore';
import { cn } from '@/utils/cn';
import { Stopwatch } from '@/components/Stopwatch';
import { BodyMap } from '@/components/charts/BodyMap';
import { Save, Pencil, Trash2, ChevronDown, ChevronUp, Star, ArrowUpRight, ArrowDownRight, Minus, GitCompareArrows, Target, Trophy, TrendingUp, AlertTriangle, ClipboardCheck, Hash } from 'lucide-react';
import type { TestingSession, Athlete, CategoryWithMetrics, Injury } from '@/types';

interface PreviousSessionData {
  date: string;
  scores: Record<string, number>;
}

interface SessionDetailClientProps {
  session: TestingSession;
  athlete: Athlete;
  athletes: Athlete[];
  categoriesWithMetrics: CategoryWithMetrics[];
  personalBests?: Record<string, number>;
  previousSession?: PreviousSessionData;
  activeInjuries?: Injury[];
  sessionIndex?: number;
  totalSessions?: number;
}

interface TrialState {
  trial1: number | null;
  trial2: number | null;
  trial3: number | null;
  reps1: number | null;
  reps2: number | null;
  reps3: number | null;
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

function TrialBarChart({ trials, trialCount }: { trials: (number | null)[]; trialCount: number }) {
  const visibleTrials = trials.slice(0, trialCount);
  const maxVal = Math.max(...visibleTrials.filter((t): t is number => t != null), 1);

  if (visibleTrials.every((t) => t == null)) return null;

  return (
    <div className="flex items-end gap-1 h-8">
      {visibleTrials.map((val, i) => {
        const height = val != null ? Math.max((val / maxVal) * 100, 8) : 0;
        return (
          <div
            key={i}
            className={cn(
              'w-5 rounded-t transition-all',
              val != null ? 'bg-black/20' : 'bg-gray-100'
            )}
            style={{ height: val != null ? `${height}%` : '4px' }}
            title={val != null ? `Trial ${i + 1}: ${val}` : `Trial ${i + 1}: —`}
          />
        );
      })}
    </div>
  );
}

function PersonalBestIndicator({ isNewPb }: { isNewPb: boolean }) {
  if (!isNewPb) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold text-warning" title="New Personal Best!">
      <Star className="h-3 w-3 fill-warning" />
      PB
    </span>
  );
}

export function SessionDetailClient({
  session,
  athlete,
  athletes,
  categoriesWithMetrics,
  personalBests = {},
  previousSession,
  activeInjuries = [],
  sessionIndex = 0,
  totalSessions = 0,
}: SessionDetailClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

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
            reps1: mwt.reps1,
            reps2: mwt.reps2,
            reps3: mwt.reps3,
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
        const current = prev[metricId] || { trial1: null, trial2: null, trial3: null, reps1: null, reps2: null, reps3: null, bestScore: null, averageScore: null };
        const updated = { ...current, [field]: value };
        const trials = [updated.trial1, updated.trial2, updated.trial3];
        updated.bestScore = computeBestScore(trials, bestScoreMethod);
        updated.averageScore = computeAverage(trials);
        return { ...prev, [metricId]: updated };
      });
    },
    [],
  );

  const updateReps = useCallback(
    (metricId: string, field: 'reps1' | 'reps2' | 'reps3', value: number | null) => {
      setTrialState((prev) => {
        const current = prev[metricId] || { trial1: null, trial2: null, trial3: null, reps1: null, reps2: null, reps3: null, bestScore: null, averageScore: null };
        return { ...prev, [metricId]: { ...current, [field]: value } };
      });
    },
    [],
  );

  function isNewPersonalBest(metricId: string, bestScore: number | null, method: 'highest' | 'lowest'): boolean {
    if (bestScore == null) return false;
    const prevBest = personalBests[metricId];
    if (prevBest === undefined) return false; // No previous data to compare
    if (method === 'highest') return bestScore > prevBest;
    return bestScore < prevBest;
  }

  // Computed session metrics
  const sessionMetrics = useMemo(() => {
    const allMetrics = categoriesWithMetrics.flatMap((c) => c.metrics).filter((m) => !m.metric.isDerived);
    const totalMetrics = allMetrics.length;
    let recorded = 0;
    let pbCount = 0;
    let improved = 0;
    let declined = 0;

    for (const mwt of allMetrics) {
      const state = trialState[mwt.metric.id];
      const best = state?.bestScore ?? null;
      if (best != null) {
        recorded++;
        if (isNewPersonalBest(mwt.metric.id, best, mwt.metric.bestScoreMethod)) {
          pbCount++;
        }
        if (previousSession) {
          const prev = previousSession.scores[mwt.metric.id];
          if (prev != null) {
            const isHigherBetter = mwt.metric.bestScoreMethod === 'highest';
            if (isHigherBetter ? best > prev : best < prev) improved++;
            if (isHigherBetter ? best < prev : best > prev) declined++;
          }
        }
      }
    }

    return { totalMetrics, recorded, pbCount, improved, declined };
  }, [categoriesWithMetrics, trialState, personalBests, previousSession]);

  // Injury body map data
  const injuryBodyMapData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const injury of activeInjuries) {
      const region = injury.bodyRegion || 'Unknown';
      counts[region] = (counts[region] || 0) + 1;
    }
    return Object.entries(counts).map(([region, count]) => ({ region, count }));
  }, [activeInjuries]);

  async function handleSaveAll() {
    setSaving(true);

    const trials = Object.entries(trialState).map(([metricId, state]) => ({
      metricId,
      trial1: state.trial1,
      trial2: state.trial2,
      trial3: state.trial3,
      reps1: state.reps1,
      reps2: state.reps2,
      reps3: state.reps3,
      bestScore: state.bestScore,
      averageScore: state.averageScore,
      existingId: state.existingId,
    }));

    const result = await saveTrialDataAction(session.id, JSON.stringify(trials));

    if (result.success) {
      addToast('Trial data saved successfully', 'success');
      router.refresh();
    } else {
      addToast(result.error || 'Failed to save trial data', 'error');
    }

    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteSessionAction(session.id);
    if (result.success) {
      addToast('Testing session deleted successfully', 'success');
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
        addToast('Session updated successfully', 'success');
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

      {/* Quick stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Hash className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{sessionIndex}</p>
              <p className="text-[11px] text-gray-500">Session (of {totalSessions})</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <ClipboardCheck className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">
                {sessionMetrics.recorded}
                <span className="text-sm font-normal text-gray-400">/{sessionMetrics.totalMetrics}</span>
              </p>
              <p className="text-[11px] text-gray-500">Metrics Recorded</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Trophy className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{sessionMetrics.pbCount}</p>
              <p className="text-[11px] text-gray-500">New Personal Bests</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              sessionMetrics.improved > 0 ? 'bg-success/10' : 'bg-gray-100',
            )}>
              <TrendingUp className={cn(
                'h-4 w-4',
                sessionMetrics.improved > 0 ? 'text-success' : 'text-gray-400',
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">
                {sessionMetrics.improved}
                {sessionMetrics.declined > 0 && (
                  <span className="text-sm font-normal text-danger"> / {sessionMetrics.declined}</span>
                )}
              </p>
              <p className="text-[11px] text-gray-500">
                Improved{sessionMetrics.declined > 0 ? ' / Declined' : ' vs Previous'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active injuries alert */}
      {activeInjuries.length > 0 && (
        <Card className="mb-6 border-warning/30 bg-warning/[0.03]" padding="none">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-semibold text-black">
                  Active Injuries ({activeInjuries.length})
                </h3>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                {session.athleteName} has {activeInjuries.length} active {activeInjuries.length === 1 ? 'injury' : 'injuries'}. Consider modifications during testing.
              </p>
              <div className="space-y-2">
                {activeInjuries.map((injury) => (
                  <div key={injury.id} className="flex items-center gap-2 text-sm">
                    <Badge variant={injury.status === 'active' ? 'danger' : injury.status === 'rehab' ? 'warning' : 'default'}>
                      {injury.status.charAt(0).toUpperCase() + injury.status.slice(1)}
                    </Badge>
                    <span className="font-medium text-black">{injury.bodyRegion}</span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-500">{injury.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <BodyMap data={injuryBodyMapData} compact />
            </div>
          </div>
        </Card>
      )}

      {/* Completion progress bar */}
      {sessionMetrics.totalMetrics > 0 && (
        <div className="mb-6">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-gray-500">Session Completion</span>
            <span className="font-medium text-black">
              {Math.round((sessionMetrics.recorded / sessionMetrics.totalMetrics) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                sessionMetrics.recorded === sessionMetrics.totalMetrics
                  ? 'bg-success'
                  : sessionMetrics.recorded > 0
                    ? 'bg-black'
                    : 'bg-gray-200',
              )}
              style={{ width: `${(sessionMetrics.recorded / sessionMetrics.totalMetrics) * 100}%` }}
            />
          </div>
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

      {/* Stopwatch */}
      <div className="mb-6">
        <Stopwatch />
      </div>

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
                      <th className="px-3 py-3 text-center font-medium text-gray-500">Visual</th>
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
                            <td colSpan={6} className="px-3 py-3 text-center text-xs text-gray-400">
                              Formula: {metric.formula || 'Not configured'}
                            </td>
                          </tr>
                        );
                      }

                      const isPb = isNewPersonalBest(metric.id, state?.bestScore ?? null, metric.bestScoreMethod);

                      return (
                        <tr key={metric.id} className={cn('border-b border-gray-100', isPb && 'bg-warning/[0.03]')}>
                          <td className="px-6 py-3 font-medium text-black">{metric.name}</td>
                          <td className="px-3 py-3 text-gray-500">{metric.unit}</td>
                          {[1, 2, 3].map((trialNum) => {
                            const show = trialNum <= metric.trialCount;
                            const field = `trial${trialNum}` as 'trial1' | 'trial2' | 'trial3';
                            const repsField = `reps${trialNum}` as 'reps1' | 'reps2' | 'reps3';
                            return (
                              <td key={trialNum} className="px-3 py-2 text-center">
                                {show ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                      value={state?.[field] ?? ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? null : Number(e.target.value);
                                        updateTrial(metric.id, field, val, metric.bestScoreMethod);
                                      }}
                                    />
                                    {metric.hasReps && (
                                      <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="reps"
                                        className="w-16 rounded border border-gray-200 px-1.5 py-0.5 text-center text-xs text-gray-500 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                        value={state?.[repsField] ?? ''}
                                        onChange={(e) => {
                                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                          updateReps(metric.id, repsField, val);
                                        }}
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center">
                            <TrialBarChart
                              trials={[state?.trial1 ?? null, state?.trial2 ?? null, state?.trial3 ?? null]}
                              trialCount={metric.trialCount}
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            {state?.bestScore != null ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center justify-center gap-1">
                                  <Badge variant={isPb ? 'warning' : 'success'}>{state.bestScore}</Badge>
                                  <PersonalBestIndicator isNewPb={isPb} />
                                </div>
                                {metric.hasReps && (() => {
                                  const trials = [state.trial1, state.trial2, state.trial3];
                                  const repsArr = [state.reps1, state.reps2, state.reps3];
                                  const bestIdx = trials.indexOf(state.bestScore);
                                  const bestReps = bestIdx >= 0 ? repsArr[bestIdx] : null;
                                  return bestReps != null ? (
                                    <span className="text-[10px] text-gray-400">x {bestReps} reps</span>
                                  ) : null;
                                })()}
                              </div>
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

      {/* Session comparison panel */}
      {previousSession && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-black hover:text-gray-700 transition-colors"
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare with Previous Session ({new Date(previousSession.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })})
            {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showComparison && (
            <Card padding="none">
              <div className="border-b border-border px-6 py-3 bg-muted/40">
                <div className="grid grid-cols-4 text-xs font-medium text-gray-500">
                  <span>Metric</span>
                  <span className="text-center">Previous</span>
                  <span className="text-center">Current</span>
                  <span className="text-center">Change</span>
                </div>
              </div>
              <div className="divide-y divide-border">
                {categoriesWithMetrics.flatMap(({ metrics: catMetrics }) =>
                  catMetrics
                    .filter((mwt) => !mwt.metric.isDerived)
                    .map((mwt) => {
                      const prevScore = previousSession.scores[mwt.metric.id];
                      const currScore = trialState[mwt.metric.id]?.bestScore;
                      const hasBoth = prevScore != null && currScore != null;
                      const delta = hasBoth ? currScore - prevScore : null;
                      const isHigherBetter = mwt.metric.bestScoreMethod === 'highest';
                      const isImproved = delta != null && (isHigherBetter ? delta > 0 : delta < 0);
                      const isDeclined = delta != null && (isHigherBetter ? delta < 0 : delta > 0);

                      return (
                        <div key={mwt.metric.id} className="grid grid-cols-4 items-center px-6 py-2.5 text-sm">
                          <span className="font-medium text-black">{mwt.metric.name}</span>
                          <span className="text-center text-gray-500">
                            {prevScore != null ? prevScore : '—'}
                          </span>
                          <span className="text-center font-semibold text-black">
                            {currScore != null ? currScore : '—'}
                          </span>
                          <span className="flex items-center justify-center gap-1">
                            {delta != null ? (
                              <>
                                {isImproved && <ArrowUpRight className="h-3.5 w-3.5 text-success" />}
                                {isDeclined && <ArrowDownRight className="h-3.5 w-3.5 text-danger" />}
                                {!isImproved && !isDeclined && <Minus className="h-3.5 w-3.5 text-gray-400" />}
                                <span className={cn(
                                  'text-xs font-medium',
                                  isImproved ? 'text-success' : isDeclined ? 'text-danger' : 'text-gray-400'
                                )}>
                                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>
            </Card>
          )}
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
