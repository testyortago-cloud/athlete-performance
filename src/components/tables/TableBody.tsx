import { cn } from '@/utils/cn';
import { Inbox } from 'lucide-react';
import type { ColumnDef } from '@/types';

interface TableBodyProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}

export function TableBody<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  isLoading,
}: TableBodyProps<T>) {
  if (isLoading) {
    return (
      <tbody>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i} className="border-b border-border last:border-b-0">
            {columns.map((col) => (
              <td key={String(col.key)} className="px-4 py-3.5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-border/50" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-4 py-16 text-center">
            <div className="flex flex-col items-center gap-2">
              <Inbox className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">No data found</p>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {data.map((row, i) => (
        <tr
          key={row.id || i}
          onClick={() => onRowClick?.(row)}
          className={cn(
            'border-b border-border border-l-2 border-l-transparent bg-white transition-colors last:border-b-0',
            onRowClick && 'cursor-pointer hover:bg-surface hover:border-l-black'
          )}
        >
          {columns.map((col) => {
            const key = String(col.key);
            const value = (row as Record<string, unknown>)[key];
            return (
              <td key={key} className="px-4 py-3.5 text-sm text-gray-700">
                {col.render ? col.render(value, row) : (value as React.ReactNode) ?? '—'}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}
