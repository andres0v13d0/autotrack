import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '70vw';
}

export default function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '70vw': 'w-[70vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-xl ${sizeClasses[size]} w-full p-6 animate-in fade-in zoom-in-95`}>
        <div className="flex items-center justify-between mb-5">
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
        {children}
      </div>
    </div>
  );
}
