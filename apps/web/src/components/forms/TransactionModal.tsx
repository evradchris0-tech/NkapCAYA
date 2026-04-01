'use client';

import { useState } from 'react';
import Modal from '@components/ui/Modal';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import TransactionForm from './TransactionForm';
import type { Membership, SessionEntry, FiscalYearConfig } from '@/types/api.types';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  memberships: Membership[];
  config?: FiscalYearConfig;
  entries?: SessionEntry[];
}

export default function TransactionModal({
  open,
  onClose,
  sessionId,
  memberships,
  config,
  entries = [],
}: TransactionModalProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const handleRequestClose = () => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setConfirmClose(false);
    setIsDirty(false);
    onClose();
  };

  const handleSuccess = () => {
    setIsDirty(false);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={open}
        onClose={handleRequestClose}
        title="Nouvelle transaction"
        size="md"
      >
        <TransactionForm
          sessionId={sessionId}
          memberships={memberships}
          config={config}
          existingEntries={entries}
          onSuccess={handleSuccess}
          onDirtyChange={setIsDirty}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmClose}
        title="Abandonner cette transaction ?"
        message="Un membre a été sélectionné. Les données saisies seront perdues si vous fermez maintenant."
        confirmLabel="Oui, abandonner"
        cancelLabel="Continuer à saisir"
        variant="warning"
        onConfirm={handleConfirmClose}
        onCancel={() => setConfirmClose(false)}
      />
    </>
  );
}
