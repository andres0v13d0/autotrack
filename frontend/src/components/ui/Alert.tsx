import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title: string;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export default function Alert({
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDuration = 3000,
}: AlertProps) {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: <CheckCircle size={24} className="text-green-600" />,
          titleColor: 'text-green-900',
          messageColor: 'text-green-800',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: <AlertCircle size={24} className="text-red-600" />,
          titleColor: 'text-red-900',
          messageColor: 'text-red-800',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: <AlertCircle size={24} className="text-yellow-600" />,
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-800',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Info size={24} className="text-blue-600" />,
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-800',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: <Info size={24} className="text-gray-600" />,
          titleColor: 'text-gray-900',
          messageColor: 'text-gray-800',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md ${styles.bg} border-l-4 ${styles.border} rounded-lg shadow-lg p-4 flex gap-3 animate-in slide-in-from-top-2`}
    >
      {styles.icon}
      <div className="flex-1">
        <h3 className={`font-bold text-sm ${styles.titleColor}`}>{title}</h3>
        {message && <p className={`text-sm ${styles.messageColor} mt-1`}>{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
