'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { MetricCategory } from '@/types';
import { createCategoryAction, updateCategoryAction } from './actions';

interface MetricCategoryFormProps {
  sportId: string;
  category?: MetricCategory;
  nextSortOrder?: number;
  onSuccess?: () => void;
}

export function MetricCategoryForm({ sportId, category, nextSortOrder = 0, onSuccess }: MetricCategoryFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!category;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('sportId', sportId);

    try {
      const result = isEdit
        ? await updateCategoryAction(category.id, sportId, formData)
        : await createCategoryAction(formData);

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
        <div className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <Input
        id="name"
        name="name"
        label="Category Name"
        defaultValue={category?.name}
        placeholder="e.g. Speed, Power, Strength"
        required
      />

      <Input
        id="sortOrder"
        name="sortOrder"
        label="Sort Order"
        type="number"
        defaultValue={String(category?.sortOrder ?? nextSortOrder)}
        min="0"
        required
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
