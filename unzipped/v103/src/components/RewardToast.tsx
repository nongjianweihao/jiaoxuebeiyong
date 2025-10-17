import { useEffect } from 'react';

interface RewardToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
  durationMs?: number;
}

export function RewardToast({ open, message, onClose, durationMs = 2200 }: RewardToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => onClose(), durationMs);
    return () => window.clearTimeout(timer);
  }, [open, onClose, durationMs]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
        <span aria-hidden>✨</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
