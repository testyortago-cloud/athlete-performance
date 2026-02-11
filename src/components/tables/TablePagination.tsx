'use client';

import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationInfo } from '@/types';

interface TablePaginationProps extends PaginationInfo {
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 25, 50];

export function TablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-md border border-border bg-white px-2 py-1 text-sm focus:border-black focus:outline-none"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {totalItems > 0 ? `${start}-${end} of ${totalItems}` : '0 results'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={cn(
              'rounded p-1 transition-colors',
              page <= 1 ? 'text-border cursor-not-allowed' : 'text-gray-500 hover:text-black hover:bg-muted'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={cn(
              'rounded p-1 transition-colors',
              page >= totalPages ? 'text-border cursor-not-allowed' : 'text-gray-500 hover:text-black hover:bg-muted'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
