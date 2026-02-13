'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToastStore } from '@/components/ui/Toast';
import { createJournalAction, updateJournalAction } from '../actions';
import { JOURNAL_TAGS } from '@/types/journal';
import type { JournalEntry } from '@/types';

interface JournalFormProps {
  entry?: JournalEntry;
  athleteId: string;
  onSuccess?: () => void;
}

const today = new Date().toISOString().split('T')[0];

export function JournalForm({ entry, athleteId, onSuccess }: JournalFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    new Set(entry?.tags || [])
  );

  const isEdit = !!entry;

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('tags', [...selectedTags].join(','));

    try {
      const result = isEdit
        ? await updateJournalAction(entry.id, formData)
        : await createJournalAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        addToast(isEdit ? 'Journal entry updated' : 'Journal entry added', 'success');
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
      <input type="hidden" name="tags" value={[...selectedTags].join(',')} />

      <Input
        id="date"
        name="date"
        label="Date"
        type="date"
        defaultValue={entry?.date || today}
        required
      />

      <div>
        <label htmlFor="content" className="mb-1.5 block text-sm font-medium text-gray-700">
          Entry
        </label>
        <textarea
          id="content"
          name="content"
          rows={5}
          defaultValue={entry?.content || ''}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          placeholder="What did you work on today? How do you feel? Any insights..."
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Tags</label>
        <div className="flex flex-wrap gap-2">
          {JOURNAL_TAGS.map((tag) => (
            <button
              key={tag.value}
              type="button"
              onClick={() => toggleTag(tag.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTags.has(tag.value)
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              #{tag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Update Entry' : 'Add Entry'}
        </Button>
      </div>
    </form>
  );
}
