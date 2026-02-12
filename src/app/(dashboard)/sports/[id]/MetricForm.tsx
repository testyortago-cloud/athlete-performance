'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToastStore } from '@/stores/toastStore';
import type { Metric } from '@/types';
import { createMetricAction, updateMetricAction } from './actions';

interface MetricFormProps {
  sportId: string;
  categoryId: string;
  metric?: Metric;
  onSuccess?: () => void;
}

export function MetricForm({ sportId, categoryId, metric, onSuccess }: MetricFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDerived, setIsDerived] = useState(metric?.isDerived || false);
  const isEdit = !!metric;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('sportId', sportId);
    formData.set('categoryId', categoryId);
    formData.set('isDerived', isDerived ? 'true' : 'false');

    try {
      const result = isEdit
        ? await updateMetricAction(metric.id, sportId, formData)
        : await createMetricAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        addToast(isEdit ? 'Metric updated successfully' : 'Metric created successfully', 'success');
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
        <div className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <Input
        id="name"
        name="name"
        label="Metric Name"
        defaultValue={metric?.name}
        placeholder="e.g. 5m Sprint, CMJ"
        required
      />

      <Input
        id="unit"
        name="unit"
        label="Unit"
        defaultValue={metric?.unit}
        placeholder="e.g. seconds, cm, kg"
        required
      />

      <Input
        id="trialCount"
        name="trialCount"
        label="Number of Trials"
        type="number"
        defaultValue={String(metric?.trialCount ?? 3)}
        min="1"
        max="10"
        required
      />

      <Select
        id="bestScoreMethod"
        name="bestScoreMethod"
        label="Best Score Method"
        defaultValue={metric?.bestScoreMethod || 'highest'}
        options={[
          { label: 'Highest', value: 'highest' },
          { label: 'Lowest', value: 'lowest' },
        ]}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDerivedCheckbox"
          checked={isDerived}
          onChange={(e) => setIsDerived(e.target.checked)}
          className="h-4 w-4 rounded border-border text-black focus:ring-black"
        />
        <label htmlFor="isDerivedCheckbox" className="text-sm font-medium text-gray-700">
          Derived metric (calculated from other metrics)
        </label>
      </div>

      {isDerived && (
        <Input
          id="formula"
          name="formula"
          label="Formula"
          defaultValue={metric?.formula || ''}
          placeholder="e.g. 505 COD time - 10m sprint time"
          helperText="Describe how this metric is calculated from other metrics"
        />
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Metric' : 'Create Metric'}
        </Button>
      </div>
    </form>
  );
}
