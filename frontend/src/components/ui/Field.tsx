import type { ReactNode } from 'react';

export function inputCls(hasError: boolean) {
  return `w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all cursor-text ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
  }`;
}

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export default function Field({ label, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-gray-700">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
