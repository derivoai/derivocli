import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Btn } from '../ui/kit';

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
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      icon={destructive ? <AlertTriangle className="w-4 h-4 text-red-600" /> : undefined}
      footer={
        <>
          <Btn variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Btn>
          <Btn variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Btn>
        </>
      }
    >
      <p className="px-6 py-5 text-sm text-muted-foreground leading-relaxed">{message}</p>
    </Modal>
  );
}
