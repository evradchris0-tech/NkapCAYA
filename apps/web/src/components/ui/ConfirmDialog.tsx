'use client';

import { AlertTriangle, Info } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'info',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const IconComponent = variant === 'info' ? Info : AlertTriangle;

  const iconBg =
    variant === 'danger'
      ? 'bg-red-100 text-red-600'
      : variant === 'warning'
      ? 'bg-amber-100 text-amber-600'
      : 'bg-blue-100 text-blue-600';

  const confirmVariant =
    variant === 'danger' ? 'danger' : 'primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${iconBg}`}>
          <IconComponent className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="text-sm text-gray-600 leading-relaxed pt-2">{message}</p>
      </div>
    </Modal>
  );
}
