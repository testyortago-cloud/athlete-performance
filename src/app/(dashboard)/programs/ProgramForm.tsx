'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { TrainingProgram } from '@/types';
import { createProgramAction, updateProgramAction } from './actions';

interface ProgramFormProps {
  program?: TrainingProgram;
  onSuccess?: () => void;
}

export function ProgramForm({ program, onSuccess }: ProgramFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!program;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = isEdit
        ? await updateProgramAction(program.id, formData)
        : await createProgramAction(formData);

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
        defaultValue={program?.name}
        placeholder="Program name"
        required
      />

      <div className="w-full">
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={program?.description}
          placeholder="Optional description"
          rows={3}
          className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Program' : 'Create Program'}
        </Button>
      </div>
    </form>
  );
}
