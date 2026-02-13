'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToastStore } from '@/components/ui/Toast';
import { computeReadinessScore } from '@/lib/services/wellnessService';
import { createWellnessAction, updateWellnessAction } from '../actions';
import type { WellnessCheckin } from '@/types';

interface WellnessFormProps {
  checkin?: WellnessCheckin;
  athleteId: string;
  onSuccess?: () => void;
}

const today = new Date().toISOString().split('T')[0];

const SLEEP_QUALITY_OPTIONS = [
  { label: '1 - Very Poor', value: '1' },
  { label: '2 - Poor', value: '2' },
  { label: '3 - Fair', value: '3' },
  { label: '4 - Good', value: '4' },
  { label: '5 - Excellent', value: '5' },
];

const SORENESS_OPTIONS = [
  { label: '1 - None', value: '1' },
  { label: '2 - Mild', value: '2' },
  { label: '3 - Moderate', value: '3' },
  { label: '4 - High', value: '4' },
  { label: '5 - Severe', value: '5' },
];

const FATIGUE_OPTIONS = [
  { label: '1 - Fresh', value: '1' },
  { label: '2 - Slight', value: '2' },
  { label: '3 - Moderate', value: '3' },
  { label: '4 - High', value: '4' },
  { label: '5 - Exhausted', value: '5' },
];

const MOOD_OPTIONS = [
  { label: '1 - Very Low', value: '1' },
  { label: '2 - Low', value: '2' },
  { label: '3 - Neutral', value: '3' },
  { label: '4 - Good', value: '4' },
  { label: '5 - Great', value: '5' },
];

const HYDRATION_OPTIONS = [
  { label: '1 - Very Poor', value: '1' },
  { label: '2 - Poor', value: '2' },
  { label: '3 - Fair', value: '3' },
  { label: '4 - Good', value: '4' },
  { label: '5 - Excellent', value: '5' },
];

export function WellnessForm({ checkin, athleteId, onSuccess }: WellnessFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [sleepHours, setSleepHours] = useState(checkin?.sleepHours ?? 7);
  const [sleepQuality, setSleepQuality] = useState(checkin?.sleepQuality ?? 3);
  const [soreness, setSoreness] = useState(checkin?.soreness ?? 1);
  const [fatigue, setFatigue] = useState(checkin?.fatigue ?? 1);
  const [mood, setMood] = useState(checkin?.mood ?? 3);
  const [hydration, setHydration] = useState(checkin?.hydration ?? 3);

  const isEdit = !!checkin;

  const readinessScore = useMemo(
    () => computeReadinessScore({ sleepHours, sleepQuality, soreness, fatigue, mood, hydration }),
    [sleepHours, sleepQuality, soreness, fatigue, mood, hydration]
  );

  const readinessColor =
    readinessScore >= 70 ? 'text-emerald-600' : readinessScore >= 40 ? 'text-amber-600' : 'text-red-600';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEdit
        ? await updateWellnessAction(checkin.id, formData)
        : await createWellnessAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        addToast(
          isEdit ? 'Wellness check-in updated' : 'Wellness check-in added',
          'success'
        );
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

      <Input
        id="date"
        name="date"
        label="Date"
        type="date"
        defaultValue={checkin?.date || today}
        required
      />

      <Input
        id="sleepHours"
        name="sleepHours"
        label="Sleep Hours"
        type="number"
        min={0}
        max={12}
        step={0.5}
        value={sleepHours}
        onChange={(e) => setSleepHours(Number(e.target.value))}
        required
      />

      <Select
        id="sleepQuality"
        name="sleepQuality"
        label="Sleep Quality"
        options={SLEEP_QUALITY_OPTIONS}
        value={String(sleepQuality)}
        onChange={(e) => setSleepQuality(Number(e.target.value))}
        required
      />

      <Select
        id="soreness"
        name="soreness"
        label="Soreness"
        options={SORENESS_OPTIONS}
        value={String(soreness)}
        onChange={(e) => setSoreness(Number(e.target.value))}
        required
      />

      <Select
        id="fatigue"
        name="fatigue"
        label="Fatigue"
        options={FATIGUE_OPTIONS}
        value={String(fatigue)}
        onChange={(e) => setFatigue(Number(e.target.value))}
        required
      />

      <Select
        id="mood"
        name="mood"
        label="Mood"
        options={MOOD_OPTIONS}
        value={String(mood)}
        onChange={(e) => setMood(Number(e.target.value))}
        required
      />

      <Select
        id="hydration"
        name="hydration"
        label="Hydration"
        options={HYDRATION_OPTIONS}
        value={String(hydration)}
        onChange={(e) => setHydration(Number(e.target.value))}
        required
      />

      {/* Live readiness preview */}
      <div className="rounded-md bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-500">Readiness Score = </span>
        <span className={`text-lg font-semibold ${readinessColor}`}>{readinessScore}</span>
        <span className="text-gray-500"> / 100</span>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Check-in' : 'Add Check-in'}
        </Button>
      </div>
    </form>
  );
}
