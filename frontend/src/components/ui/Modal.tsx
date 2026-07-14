import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '70vw' | '90vw';
}

export default function Modal({ title, onClose, children, footer, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '70vw': 'w-[70vw]',
    '90vw': 'w-[90vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-xl ${sizeClasses[size]} w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95`}>
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: '#0f1f3d' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-2 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
