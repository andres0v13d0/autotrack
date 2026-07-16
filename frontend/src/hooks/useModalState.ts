import { useState } from 'react';
import type { AlertType } from '../components/ui/Alert';

interface AlertState {
  type: AlertType;
  title: string;
  message?: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
}

export const useModalState = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowDetailModal(false);
    setShowPaymentModal(false);
    setShowWorkOrderModal(false);
  };

  return {
    showCreateModal,
    setShowCreateModal,
    showDetailModal,
    setShowDetailModal,
    showPaymentModal,
    setShowPaymentModal,
    showWorkOrderModal,
    setShowWorkOrderModal,
    alert,
    setAlert,
    confirmDialog,
    setConfirmDialog,
    closeAllModals,
  };
};
