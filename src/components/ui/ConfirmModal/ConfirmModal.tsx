'use client';

import {type ReactNode} from 'react';
import {Modal} from '@/components/ui/Modal';
import {Button} from '@/components/ui/Button';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {description ? (
        <p className="type-body-md text-on-surface-secondary">{description}</p>
      ) : null}
      {error ? (
        <p className="mt-3 type-body-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
