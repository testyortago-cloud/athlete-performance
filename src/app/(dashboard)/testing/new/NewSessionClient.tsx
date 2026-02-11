'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createSessionAction } from '../actions';
import type { Athlete } from '@/types';

interface NewSessionClientProps {
  athletes: Athlete[];
}

const today = new Date().toISOString().split('T')[0];

export function NewSessionClient({ athletes }: NewSessionClientProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const athleteOptions = athletes.map((a) => ({ label: a.name, value: a.id }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createSessionAction(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.sessionId) {
        router.push(`/testing/${result.sessionId}`);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New Session"
        breadcrumbs={[
          { label: 'Testing', href: '/testing' },
          { label: 'New Session' },
        ]}
      />

      <Card className="max-w-lg">
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
            placeholder="Select an athlete"
            required
          />

          <Input
            id="date"
            name="date"
            label="Date"
            type="date"
            defaultValue={today}
            required
          />

          <Input
            id="notes"
            name="notes"
            label="Notes"
            placeholder="Optional session notes"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => router.push('/testing')}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Session
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
