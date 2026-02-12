'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useToastStore } from '@/stores/toastStore';
import { batchCreateDailyLoadAction } from './actions';
import { cn } from '@/utils/cn';
import type { Athlete } from '@/types';

interface BatchLoadFormProps {
  athletes: Athlete[];
  onSuccess?: () => void;
}

interface RowData {
  athleteId: string;
  athleteName: string;
  photo?: string;
  include: boolean;
  rpe: number;
  duration: number;
  sessionType: string;
}

const SESSION_TYPES = ['Training', 'Match', 'Gym', 'Conditioning', 'Recovery', 'Other'];

export function BatchLoadForm({ athletes, onSuccess }: BatchLoadFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeAthletes = athletes.filter((a) => a.status === 'active');

  const [rows, setRows] = useState<RowData[]>(
    activeAthletes.map((a) => ({
      athleteId: a.id,
      athleteName: a.name,
      photo: a.photo?.thumbnails?.large?.url ?? a.photo?.url,
      include: true,
      rpe: 5,
      duration: 60,
      sessionType: 'Training',
    }))
  );

  function updateRow(idx: number, field: keyof RowData, value: unknown) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function setAllSessionType(type: string) {
    setRows((prev) => prev.map((r) => ({ ...r, sessionType: type })));
  }

  function toggleAll(include: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, include })));
  }

  const includedCount = rows.filter((r) => r.include).length;

  async function handleSubmit() {
    const entries = rows
      .filter((r) => r.include)
      .map((r) => ({
        athleteId: r.athleteId,
        date,
        rpe: r.rpe,
        durationMinutes: r.duration,
        sessionType: r.sessionType,
      }));

    if (entries.length === 0) {
      setError('No athletes selected');
      return;
    }

    setError('');
    setLoading(true);
    const result = await batchCreateDailyLoadAction(entries);
    if (result.success) {
      addToast(`${result.count} load entries created`, 'success');
      onSuccess?.();
      router.refresh();
    } else {
      setError(result.error || 'Failed to create entries');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border px-3 py-1.5 text-sm focus:border-black focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Set all session type</label>
          <select
            onChange={(e) => setAllSessionType(e.target.value)}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm focus:border-black focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>Apply to all...</option>
            {SESSION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleAll(true)}
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="max-h-[400px] overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <tr className="border-b border-border">
              <th className="w-10 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={includedCount === rows.length}
                  ref={(el) => { if (el) el.indeterminate = includedCount > 0 && includedCount < rows.length; }}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Athlete</th>
              <th className="w-20 px-3 py-2 text-center font-medium text-gray-500">RPE</th>
              <th className="w-24 px-3 py-2 text-center font-medium text-gray-500">Duration</th>
              <th className="w-32 px-3 py-2 text-center font-medium text-gray-500">Session Type</th>
              <th className="w-20 px-3 py-2 text-right font-medium text-gray-500">Load</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.athleteId}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  !row.include && 'opacity-40'
                )}
              >
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(e) => updateRow(idx, 'include', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar src={row.photo} name={row.athleteName} size="sm" />
                    <span className="font-medium text-black">{row.athleteName}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={row.rpe}
                    onChange={(e) => updateRow(idx, 'rpe', Number(e.target.value))}
                    disabled={!row.include}
                    className="w-full rounded border border-border px-2 py-1 text-center text-sm focus:border-black focus:outline-none disabled:bg-gray-50"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={row.duration}
                    onChange={(e) => updateRow(idx, 'duration', Number(e.target.value))}
                    disabled={!row.include}
                    className="w-full rounded border border-border px-2 py-1 text-center text-sm focus:border-black focus:outline-none disabled:bg-gray-50"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.sessionType}
                    onChange={(e) => updateRow(idx, 'sessionType', e.target.value)}
                    disabled={!row.include}
                    className="w-full rounded border border-border bg-white px-2 py-1 text-sm focus:border-black focus:outline-none disabled:bg-gray-50"
                  >
                    {SESSION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right font-semibold text-black">
                  {row.include ? row.rpe * row.duration : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-500">
          {includedCount} of {rows.length} athletes included
        </span>
        <Button onClick={handleSubmit} loading={loading} disabled={includedCount === 0}>
          Save {includedCount} Entries
        </Button>
      </div>
    </div>
  );
}
