'use client';

import { useState, useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface HelpTipProps {
  term: string;
  description: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function HelpTip({ term, description, side = 'top', className }: HelpTipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function show() {
    timeoutRef.current = setTimeout(() => setVisible(true), 150);
  }

  function hide() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <span
      className={cn('relative inline-flex cursor-help', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      role="button"
      aria-label={`Help: ${term}`}
    >
      <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 w-56 rounded-lg bg-black p-3 shadow-xl pointer-events-none',
            positionStyles[side]
          )}
        >
          <p className="text-xs font-semibold text-white">{term}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/70">{description}</p>
        </div>
      )}
    </span>
  );
}
