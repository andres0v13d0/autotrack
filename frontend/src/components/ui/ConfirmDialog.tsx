import { AlertCircle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-semibold disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm rounded-lg text-white font-semibold cursor-pointer transition-opacity disabled:opacity-60 ${
              isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          className={`flex gap-3 p-4 rounded-lg ${
            isDangerous ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <AlertCircle
            size={24}
            className={isDangerous ? 'text-red-600 flex-shrink-0' : 'text-blue-600 flex-shrink-0'}
          />
          <p
            className={`text-sm ${isDangerous ? 'text-red-800' : 'text-blue-800'}`}
          >
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
