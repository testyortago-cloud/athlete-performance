'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Filter, X } from 'lucide-react';

interface ColumnFilterProps {
  type: 'text' | 'select' | 'number';
  value: string;
  onChange: (value: string) => void;
  options?: { label: string; value: string }[];
  columnName: string;
}

export function ColumnFilter({ type, value, onChange, options, columnName }: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'ml-1 rounded p-0.5 transition-colors',
          value ? 'text-black' : 'text-gray-500 hover:text-black'
        )}
        title={`Filter ${columnName}`}
      >
        <Filter className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-white p-2 shadow-lg">
          {type === 'select' && options ? (
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded border border-border bg-muted px-2 py-1.5 text-sm focus:border-black focus:outline-none"
            >
              <option value="">All</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Filter ${columnName}...`}
              className="w-full rounded border border-border bg-muted px-2 py-1.5 text-sm focus:border-black focus:outline-none"
              autoFocus
            />
          )}
          {value && (
            <button
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="mt-1.5 flex w-full items-center justify-center gap-1 rounded bg-muted px-2 py-1 text-xs text-gray-700 hover:bg-border"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
