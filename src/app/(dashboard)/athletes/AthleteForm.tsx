'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Athlete, Sport, TrainingProgram } from '@/types';
import { createAthleteAction, updateAthleteAction } from './actions';

interface AthleteFormProps {
  athlete?: Athlete;
  sports: Sport[];
  programs: TrainingProgram[];
  onSuccess?: () => void;
}

export function AthleteForm({ athlete, sports, programs, onSuccess }: AthleteFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!athlete;

  // Controlled state for reliable pre-fill
  const [name, setName] = useState(athlete?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(athlete?.dateOfBirth || '');
  const [sportId, setSportId] = useState(athlete?.sportId || '');
  const [programId, setProgramId] = useState(athlete?.programId || '');
  const [position, setPosition] = useState(athlete?.position || '');
  const [status, setStatus] = useState(athlete?.status || 'active');

  const sportOptions = sports.map((s) => ({ label: s.name, value: s.id }));
  const programOptions = [
    { label: 'None', value: '' },
    ...programs.map((p) => ({ label: p.name, value: p.id })),
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEdit
        ? await updateAthleteAction(athlete.id, formData)
        : await createAthleteAction(formData);

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

      <Input
        id="name"
        name="name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Athlete name"
        required
      />

      <Input
        id="dateOfBirth"
        name="dateOfBirth"
        label="Date of Birth"
        type="date"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
        required
      />

      <Select
        id="sportId"
        name="sportId"
        label="Sport"
        options={sportOptions}
        value={sportId}
        onChange={(e) => setSportId(e.target.value)}
        placeholder="Select a sport"
        required
      />

      <Select
        id="programId"
        name="programId"
        label="Program"
        options={programOptions}
        value={programId}
        onChange={(e) => setProgramId(e.target.value)}
        placeholder="Select a program"
      />

      <Input
        id="position"
        name="position"
        label="Position"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        placeholder="e.g. Point Guard, Striker"
        required
      />

      <Select
        id="status"
        name="status"
        label="Status"
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
        value={status}
        onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Athlete' : 'Create Athlete'}
        </Button>
      </div>
    </form>
  );
}
