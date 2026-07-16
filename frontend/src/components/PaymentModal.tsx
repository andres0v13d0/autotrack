import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertCircle, CreditCard, DollarSign, Wallet } from 'lucide-react';
import Modal from './ui/Modal';
import Field, { inputCls } from './ui/Field';
import { formatCurrency } from '../utils/customerUtils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<any>;
  balance: { total: number; paid: number; debt: number };
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  form,
  balance,
  onSubmit,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const { register, formState, trigger, handleSubmit } = form;

  return (
    <Modal title="Register Payment" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl p-5">
          <div className="flex gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 text-sm">Account Overview</p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Total Due</p>
                  <p className="font-bold text-lg text-blue-600 mt-1">
                    {formatCurrency(balance.debt)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Total Paid</p>
                  <p className="font-bold text-lg text-green-600 mt-1">
                    {formatCurrency(balance.paid)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Total Invoiced</p>
                  <p className="font-bold text-lg text-gray-700 mt-1">
                    {formatCurrency(balance.total)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-gray-50 rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Payment Details
          </p>

          {/* Amount */}
          <div>
            <Field label="Amount" error={formState.errors.amount?.message as string}>
              <div className="relative">
                <DollarSign size={20} className="absolute left-3 top-3.5" style={{ color: '#f97316' }} />
                <input
                  {...register('amount', {
                    valueAsNumber: true,
                    setValueAs: (val) => {
                      const num = parseFloat(val);
                      return isNaN(num) ? 0 : num;
                    },
                  })}
                  type="number"
                  step="0.01"
                  min="0.01"
                  onBlur={() => trigger('amount')}
                  className={`${inputCls(!!formState.errors.amount)} text-base px-4 pl-10 py-3 rounded-lg w-full`}
                  placeholder="0.00"
                />
              </div>
            </Field>
          </div>

          {/* Payment Method */}
          <div>
            <Field label="Payment Method" error={formState.errors.method?.message as string}>
              <div className="relative">
                <select
                  {...register('method')}
                  onBlur={() => trigger('method')}
                  className={`${inputCls(!!formState.errors.method)} text-base px-4 py-3 rounded-lg w-full appearance-none cursor-pointer bg-white`}
                >
                  <option value="">Select method...</option>
                  <option value="zelle">Zelle</option>
                  <option value="card">Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none">
                  <Wallet size={20} style={{ color: '#f97316' }} />
                </div>
              </div>
            </Field>
          </div>

          {/* Payment Date */}
          <div>
            <Field label="Payment Date" error={formState.errors.date?.message as string}>
              <input
                {...register('date')}
                type="date"
                onBlur={() => trigger('date')}
                className={`${inputCls(!!formState.errors.date)} text-base px-4 py-3 rounded-lg w-full`}
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity inline-flex items-center gap-2"
            style={{ backgroundColor: '#f97316' }}
          >
            <CreditCard size={16} />
            {isLoading ? 'Processing...' : 'Register Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
