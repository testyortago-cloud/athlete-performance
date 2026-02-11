'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { DailyLoad, Athlete } from '@/types';
import { createDailyLoadAction, updateDailyLoadAction } from './actions';

interface DailyLoadFormProps {
  load?: DailyLoad;
  athletes: Athlete[];
  onSuccess?: () => void;
}

const today = new Date().toISOString().split('T')[0];

export function DailyLoadForm({ load, athletes, onSuccess }: DailyLoadFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rpe, setRpe] = useState(load?.rpe ?? 5);
  const [duration, setDuration] = useState(load?.durationMinutes ?? 60);

  const isEdit = !!load;

  const athleteOptions = athletes
    .filter((a) => a.status === 'active')
    .map((a) => ({ label: a.name, value: a.id }));

  const sessionTypeOptions = [
    { label: 'Training', value: 'Training' },
    { label: 'Match', value: 'Match' },
    { label: 'Gym', value: 'Gym' },
    { label: 'Conditioning', value: 'Conditioning' },
    { label: 'Recovery', value: 'Recovery' },
    { label: 'Other', value: 'Other' },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEdit
        ? await updateDailyLoadAction(load.id, formData)
        : await createDailyLoadAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
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

      <Select
        id="athleteId"
        name="athleteId"
        label="Athlete"
        options={athleteOptions}
        defaultValue={load?.athleteId}
        placeholder="Select an athlete"
        required
      />

      <Input
        id="date"
        name="date"
        label="Date"
        type="date"
        defaultValue={load?.date || today}
        required
      />

      <Input
        id="rpe"
        name="rpe"
        label="RPE (1-10)"
        type="number"
        min={1}
        max={10}
        value={rpe}
        onChange={(e) => setRpe(Number(e.target.value))}
        required
      />

      <Input
        id="durationMinutes"
        name="durationMinutes"
        label="Duration (minutes)"
        type="number"
        min={1}
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        required
      />

      <div className="rounded-md bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-500">Training Load = </span>
        <span className="font-semibold text-black">{rpe * duration}</span>
        <span className="text-gray-500"> (RPE x Duration)</span>
      </div>

      <Select
        id="sessionType"
        name="sessionType"
        label="Session Type"
        options={sessionTypeOptions}
        defaultValue={load?.sessionType || 'Training'}
        required
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Entry' : 'Add Entry'}
        </Button>
      </div>
    </form>
  );
}
