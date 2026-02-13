'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToastStore } from '@/components/ui/Toast';
import { createGoalAction, updateGoalAction } from '../actions';
import type { Goal, Metric } from '@/types';

interface GoalFormProps {
  goal?: Goal;
  athleteId: string;
  metrics: Metric[];
  onSuccess?: () => void;
}

const DIRECTION_OPTIONS = [
  { label: 'Higher is better', value: 'higher' },
  { label: 'Lower is better', value: 'lower' },
];

export function GoalForm({ goal, athleteId, metrics, onSuccess }: GoalFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState(goal?.metricId || '');

  const isEdit = !!goal;

  const metricOptions = metrics.map((m) => ({
    label: `${m.name} (${m.unit})`,
    value: m.id,
  }));

  const selectedMetric = metrics.find((m) => m.id === selectedMetricId);
  const defaultDirection = selectedMetric?.bestScoreMethod === 'lowest' ? 'lower' : 'higher';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // Inject the metric name from the selected metric
    const metric = metrics.find((m) => m.id === formData.get('metricId'));
    if (metric) {
      formData.set('metricName', metric.name);
    }

    try {
      const result = isEdit
        ? await updateGoalAction(goal.id, formData)
        : await createGoalAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        addToast(isEdit ? 'Goal updated' : 'Goal created', 'success');
        onSuccess?.();
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <input type="hidden" name="athleteId" value={athleteId} />
      <input type="hidden" name="metricName" value={selectedMetric?.name || goal?.metricName || ''} />

      <Select
        id="metricId"
        name="metricId"
        label="Metric"
        options={metricOptions}
        value={selectedMetricId}
        onChange={(e) => setSelectedMetricId(e.target.value)}
        placeholder="Select a metric..."
        required
      />

      <Input
        id="targetValue"
        name="targetValue"
        label={`Target Value${selectedMetric ? ` (${selectedMetric.unit})` : ''}`}
        type="number"
        step="any"
        defaultValue={goal?.targetValue}
        required
      />

      <Select
        id="direction"
        name="direction"
        label="Direction"
        options={DIRECTION_OPTIONS}
        defaultValue={goal?.direction || defaultDirection}
        required
      />

      <Input
        id="deadline"
        name="deadline"
        label="Deadline (optional)"
        type="date"
        defaultValue={goal?.deadline || ''}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Goal' : 'Set Goal'}
        </Button>
      </div>
    </form>
  );
}
