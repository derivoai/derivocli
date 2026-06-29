import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Reusable confirmation modal for destructive actions. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-[#0b0b0b] border border-white/[0.08] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            {destructive && <AlertTriangle className="w-4 h-4 text-red-400" />}
            <h2 className="text-base font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-white/70 leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.04] bg-white/[0.01]">
          <button
            onClick={onCancel}
            disabled={busy}
            className="h-9 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold border border-white/[0.06] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`h-9 px-4 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 ${
              destructive
                ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
