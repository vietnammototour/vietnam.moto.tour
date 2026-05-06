'use client';

import {useEffect, useCallback, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: ReactNode;
  footer?: ReactNode;
};

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-5xl',
};

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const modal = (
    <>
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className={`bg-surface-elevated rounded-xl shadow-2xl w-full ${sizeClasses[size]} p-6`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="type-title-lg text-on-surface">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-on-surface-secondary hover:text-on-surface transition-colors cursor-pointer"
                aria-label="Close"
              >
                <i className="fa fa-times text-xl" />
              </button>
            </div>
          )}

          <div>{children}</div>

          {footer && (
            <div className="mt-4 pt-4 border-t border-border">{footer}</div>
          )}
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
