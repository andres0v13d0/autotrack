import React from 'react';
import { User, CreditCard, Truck, Wrench, Phone } from 'lucide-react';
import type { Customer, Vehicle } from '../types';
import { CustomerDetailSkeleton } from './ui/Skeletons';
import Modal from './ui/Modal';
import { formatCurrency, formatWorkOrderDate } from '../utils/customerUtils';

interface CustomerDetailProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  vehicles: Vehicle[];
  workOrders: any[];
  balance: { total: number; paid: number; debt: number };
  isLoading: boolean;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  isOpen,
  onClose,
  customer,
  vehicles,
  workOrders,
  balance,
  isLoading,
}) => {
  if (!isOpen || !customer) return null;

  return (
    <Modal title={`${customer.name}`} onClose={onClose} size="lg">
      {isLoading ? (
        <CustomerDetailSkeleton />
      ) : (
        <div className="space-y-5">
          {/* Contact Card */}
          <div className="bg-white rounded-xl p-5 border-l-4" style={{ borderLeftColor: '#f97316' }}>
            <div className="flex items-start gap-3">
              <User size={24} style={{ color: '#f97316' }} className="flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-base mb-3" style={{ color: '#0f1f3d' }}>
                  Contact Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Name</p>
                    <p className="font-bold text-sm mt-1" style={{ color: '#0f1f3d' }}>
                      {customer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Phone</p>
                    <p className="font-bold text-sm mt-1 flex items-center gap-2">
                      <Phone size={16} style={{ color: '#f97316' }} /> {customer.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Summary */}
          <div className="bg-white rounded-xl p-5 border-l-4" style={{ borderLeftColor: '#f97316' }}>
            <div className="flex items-start gap-3 mb-4">
              <CreditCard size={24} style={{ color: '#f97316' }} className="flex-shrink-0 mt-0.5" />
              <h3 className="font-bold text-base" style={{ color: '#0f1f3d' }}>
                Account Balance
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg text-center border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Total</p>
                <p className="font-bold text-lg" style={{ color: '#0f1f3d' }}>
                  {formatCurrency(balance.total)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Paid</p>
                <p className="font-bold text-lg text-green-600">
                  {formatCurrency(balance.paid)}
                </p>
              </div>
              <div
                className={`bg-gradient-to-br ${
                  balance.debt > 0 ? 'from-red-50 to-red-100' : 'from-green-50 to-green-100'
                } p-4 rounded-lg text-center ${
                  balance.debt > 0 ? 'border border-red-200' : 'border border-green-200'
                }`}
              >
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Due</p>
                <p
                  className={`font-bold text-lg ${
                    balance.debt > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(balance.debt)}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicles */}
          <div className="bg-white rounded-xl p-5 border-l-4" style={{ borderLeftColor: '#f97316' }}>
            <div className="flex items-start gap-3 mb-4">
              <Truck size={24} style={{ color: '#f97316' }} className="flex-shrink-0 mt-0.5" />
              <h3 className="font-bold text-base" style={{ color: '#0f1f3d' }}>
                Vehicles
              </h3>
            </div>
            {vehicles.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No vehicles registered</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-gray-50 p-3 rounded-lg border-l-2"
                    style={{ borderLeftColor: '#f97316' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm" style={{ color: '#0f1f3d' }}>
                          {vehicle.plate}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{vehicle.model}</p>
                        {vehicle.description && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            {vehicle.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl p-5 border-l-4" style={{ borderLeftColor: '#f97316' }}>
            <div className="flex items-start gap-3 mb-4">
              <Wrench size={24} style={{ color: '#f97316' }} className="flex-shrink-0 mt-0.5" />
              <h3 className="font-bold text-base" style={{ color: '#0f1f3d' }}>
                Recent Orders
              </h3>
            </div>
            {workOrders.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No work orders found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {workOrders.slice(0, 8).map((wo: any) => {
                  const subtotal = Number(wo.subtotal);
                  const taxRate = Number(wo.tax_rate);
                  const total = subtotal + subtotal * taxRate;
                  return (
                    <div
                      key={wo.id}
                      className="bg-gray-50 p-3 rounded-lg border-l-2 hover:shadow-md transition-shadow"
                      style={{ borderLeftColor: '#10b981' }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm" style={{ color: '#0f1f3d' }}>
                            Order #{wo.order_number || wo.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatWorkOrderDate(wo.created_at)}
                          </p>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-white text-xs font-bold text-nowrap ml-2"
                          style={{ backgroundColor: '#10b981' }}
                        >
                          {total.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-3 pt-4 border-t mt-6">
        <button
          onClick={onClose}
          className="px-6 py-2 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-semibold"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
