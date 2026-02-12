'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/stores/toastStore';
import { updateInjuryStatusAction } from './actions';
import { GripVertical } from 'lucide-react';
import type { Injury, InjuryStatus } from '@/types';

interface InjuryKanbanProps {
  injuries: Injury[];
}

const COLUMNS: { status: InjuryStatus; label: string; variant: 'danger' | 'warning' | 'default' | 'success'; color: string }[] = [
  { status: 'active', label: 'Active', variant: 'danger', color: 'border-t-danger' },
  { status: 'rehab', label: 'Rehab', variant: 'warning', color: 'border-t-warning' },
  { status: 'monitoring', label: 'Monitoring', variant: 'default', color: 'border-t-gray-400' },
  { status: 'resolved', label: 'Resolved', variant: 'success', color: 'border-t-success' },
];

export function InjuryKanban({ injuries }: InjuryKanbanProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<InjuryStatus | null>(null);
  const dragItemRef = useRef<Injury | null>(null);

  function handleDragStart(e: React.DragEvent, injury: Injury) {
    dragItemRef.current = injury;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', injury.id);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    dragItemRef.current = null;
    setDragOverColumn(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }

  function handleDragOver(e: React.DragEvent, status: InjuryStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  async function handleDrop(e: React.DragEvent, newStatus: InjuryStatus) {
    e.preventDefault();
    setDragOverColumn(null);

    const injury = dragItemRef.current;
    if (!injury || injury.status === newStatus) return;

    setUpdatingId(injury.id);
    const result = await updateInjuryStatusAction(injury.id, newStatus);
    if (result.success) {
      addToast(`Moved to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, 'success');
      router.refresh();
    } else {
      addToast(result.error || 'Failed to update status', 'error');
    }
    setUpdatingId(null);
  }

  function daysSinceOccurred(dateOccurred: string): number {
    return Math.ceil((Date.now() - new Date(dateOccurred).getTime()) / 86400000);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const columnInjuries = injuries.filter((i) => i.status === col.status);
        const isOver = dragOverColumn === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`flex flex-col rounded-lg border border-t-4 ${col.color} bg-muted/30 transition-colors ${
              isOver ? 'bg-muted/60 ring-2 ring-black/10' : ''
            }`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-black">{col.label}</h3>
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black/10 px-1.5 text-xs font-medium text-black">
                  {columnInjuries.length}
                </span>
              </div>
            </div>

            {/* Column body */}
            <div className="flex-1 space-y-2 px-2 pb-2" style={{ minHeight: '120px' }}>
              {columnInjuries.length === 0 && (
                <div className="flex h-full min-h-[100px] items-center justify-center rounded-md border-2 border-dashed border-border/50 text-xs text-gray-400">
                  Drop here
                </div>
              )}
              {columnInjuries.map((injury) => (
                <div
                  key={injury.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, injury)}
                  onDragEnd={handleDragEnd}
                  onClick={() => router.push(`/injuries/${injury.id}`)}
                  className={`cursor-grab rounded-md border border-border bg-white p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing ${
                    updatingId === injury.id ? 'animate-pulse opacity-60' : ''
                  }`}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-1">
                    <span className="text-sm font-medium text-black leading-tight">
                      {injury.athleteName}
                    </span>
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-600 leading-snug">{injury.bodyRegion}</p>
                  <p className="mt-0.5 text-xs text-gray-400 truncate">{injury.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={injury.type === 'injury' ? 'warning' : 'danger'}>
                      {injury.type === 'injury' ? 'Injury' : 'Illness'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {col.status === 'resolved' && injury.daysLost != null
                        ? `${injury.daysLost}d`
                        : `${daysSinceOccurred(injury.dateOccurred)}d`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
