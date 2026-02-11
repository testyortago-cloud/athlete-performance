'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'left', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1 z-50 min-w-[180px] rounded-md border border-border bg-white py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <DropdownContext.Provider value={{ close }}>
            {children}
          </DropdownContext.Provider>
        </div>
      )}
    </div>
  );
}

import { createContext, useContext } from 'react';

const DropdownContext = createContext<{ close: () => void }>({ close: () => {} });

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
}

export function DropdownItem({ children, onClick, className, danger }: DropdownItemProps) {
  const { close } = useContext(DropdownContext);

  return (
    <button
      onClick={() => {
        onClick?.();
        close();
      }}
      className={cn(
        'flex w-full items-center px-3 py-2 text-sm transition-colors',
        danger
          ? 'text-danger hover:bg-danger/5'
          : 'text-gray-700 hover:bg-muted',
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-border" />;
}
