import { cn } from '@/utils/cn';

interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentArea({ children, className }: ContentAreaProps) {
  return (
    <main
      className={cn(
        'min-h-[calc(100vh-var(--header-height))] bg-surface p-6',
        className
      )}
    >
      {children}
    </main>
  );
}
