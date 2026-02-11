'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Injury, Athlete } from '@/types';
import { createInjuryAction, updateInjuryAction } from './actions';

interface InjuryFormProps {
  injury?: Injury;
  athletes: Athlete[];
  onSuccess?: () => void;
}

export function InjuryForm({ injury, athletes, onSuccess }: InjuryFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateOccurred, setDateOccurred] = useState(injury?.dateOccurred || '');
  const [dateResolved, setDateResolved] = useState(injury?.dateResolved || '');
  const [status, setStatus] = useState(injury?.status || 'active');

  const isEdit = !!injury;

  const athleteOptions = athletes
    .filter((a) => a.status === 'active')
    .map((a) => ({ label: a.name, value: a.id }));

  const daysLostPreview = useMemo(() => {
    if (!dateOccurred || !dateResolved) return null;
    const occurred = new Date(dateOccurred).getTime();
    const resolved = new Date(dateResolved).getTime();
    if (isNaN(occurred) || isNaN(resolved) || resolved < occurred) return null;
    return Math.ceil((resolved - occurred) / 86400000);
  }, [dateOccurred, dateResolved]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEdit
        ? await updateInjuryAction(injury.id, formData)
        : await createInjuryAction(formData);

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

  function handleDateResolvedChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setDateResolved(value);
    if (value) {
      setStatus('resolved');
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
        defaultValue={injury?.athleteId}
        placeholder="Select an athlete"
        required
      />

      <Select
        id="type"
        name="type"
        label="Type"
        options={[
          { label: 'Injury', value: 'injury' },
          { label: 'Illness', value: 'illness' },
        ]}
        defaultValue={injury?.type || 'injury'}
        required
      />

      <Input
        id="description"
        name="description"
        label="Description"
        defaultValue={injury?.description}
        placeholder="e.g. ACL tear, hamstring strain"
        required
      />

      <Input
        id="mechanism"
        name="mechanism"
        label="Mechanism"
        defaultValue={injury?.mechanism}
        placeholder="e.g. Non-contact, landing"
      />

      <Input
        id="bodyRegion"
        name="bodyRegion"
        label="Body Region"
        defaultValue={injury?.bodyRegion}
        placeholder="e.g. Knee, Hamstring, Shoulder"
        required
      />

      <Input
        id="dateOccurred"
        name="dateOccurred"
        label="Date Occurred"
        type="date"
        defaultValue={injury?.dateOccurred}
        onChange={(e) => setDateOccurred(e.target.value)}
        required
      />

      <Input
        id="dateResolved"
        name="dateResolved"
        label="Date Resolved"
        type="date"
        value={dateResolved}
        onChange={handleDateResolvedChange}
      />

      {daysLostPreview != null && (
        <p className="text-sm text-gray-500">
          Estimated days lost: <span className="font-medium text-black">{daysLostPreview}</span>
        </p>
      )}

      <Select
        id="status"
        name="status"
        label="Status"
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Resolved', value: 'resolved' },
        ]}
        value={status}
        onChange={(e) => setStatus(e.target.value as 'active' | 'resolved')}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Injury' : 'Log Injury'}
        </Button>
      </div>
    </form>
  );
}
