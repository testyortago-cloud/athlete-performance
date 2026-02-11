'use client';

import { useToastStore } from '@/stores/toastStore';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast } from '@/stores/toastStore';

export { useToastStore } from '@/stores/toastStore';

const iconMap = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
} as const;

const colorMap = {
  success: '#22C55E',
  error: '#EF4444',
  info: '#000000',
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();
  const Icon = iconMap[toast.type];
  const color = colorMap[toast.type];

  return (
    <div
      className="flex items-center gap-3 rounded-md border border-border bg-white px-4 py-3 shadow-md"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: color,
        animation: 'toast-slide-in 0.2s ease-out',
      }}
    >
      <Icon className="h-5 w-5 shrink-0" style={{ color }} />
      <p className="flex-1 text-sm text-black">{toast.message}</p>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
