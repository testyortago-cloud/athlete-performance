'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Search, X } from 'lucide-react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  value?: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...props }, ref) => {
    return (
      <div className={cn('relative', className)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          ref={ref}
          type="text"
          value={value}
          className="w-full rounded-md border border-border bg-muted py-2 pl-10 pr-8 text-sm text-black placeholder:text-gray-500 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-gray-500 hover:text-black"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
export { SearchInput };
