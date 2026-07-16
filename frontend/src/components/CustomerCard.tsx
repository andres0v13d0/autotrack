import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Truck, MoreVertical, Clock, CheckCircle, DollarSign } from 'lucide-react';
import axios from 'axios';
import { paymentsService } from '../services/payments.service';
import type { Customer } from '../types';

interface CustomerCardProps {
  customer: Customer;
  onCardClick: () => void;
  onActionClick: (e: React.MouseEvent) => void;
  onMoreClick: (ref: HTMLButtonElement | null) => void;
}

export default function CustomerCard({
  customer,
  onCardClick,
  onActionClick,
  onMoreClick,
}: CustomerCardProps) {
  const [serviceStatus, setServiceStatus] = useState<{ inService: any[]; readyForPickup: any[] }>({ inService: [], readyForPickup: [] });
  const [customerBalance, setCustomerBalance] = useState({ total: 0, paid: 0, debt: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCardData = async () => {
      try {
        const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000' });
        api.interceptors.request.use((config) => {
          const token = localStorage.getItem('access_token');
          if (token) config.headers.Authorization = `Bearer ${token}`;
          return config;
        });

        // Get work orders
        const allWorkOrders = await api.get('/work-orders').then(res => res.data);
        const filtered = allWorkOrders.filter((wo: any) => wo.vehicle?.customer_id === customer.id);
        
        // Group by status
        const inService = filtered.filter((wo: any) => wo.delivery_status === 'new' || wo.delivery_status === 'in_progress');
        const readyForPickup = filtered.filter((wo: any) => wo.delivery_status === 'ready');
        
        setServiceStatus({ inService, readyForPickup });

        // Calculate balance
        let totalAmount = 0, totalPaid = 0;
        for (const wo of filtered) {
          const subtotal = Number(wo.subtotal);
          const taxRate = Number(wo.tax_rate);
          totalAmount += subtotal + (subtotal * taxRate);
          try {
            const payments = await paymentsService.getByWorkOrder(wo.id);
            totalPaid += payments.reduce((sum: number, p: any) => sum + p.amount, 0);
          } catch (e) { }
        }
        setCustomerBalance({ total: totalAmount, paid: totalPaid, debt: totalAmount - totalPaid });
      } catch (e) {
        console.error('Error loading card data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadCardData();
  }, [customer.id]);

  const hasServiceStatus = serviceStatus.inService.length > 0 || serviceStatus.readyForPickup.length > 0;
  const hasDebt = customerBalance.debt > 0;

  return (
    <div 
      onClick={onCardClick}
      className="group relative rounded-xl p-5 hover:shadow-xl transition-all duration-300 cursor-pointer"
      style={{ backgroundColor: '#0f1f3d' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">{customer.name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-300 mt-2">
            <Phone size={16} style={{ color: '#f97316' }} />
            <span className="font-medium">{customer.phone}</span>
          </div>
        </div>
        <div onClick={onActionClick} data-dropdown>
          <button 
            ref={onMoreClick}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <MoreVertical size={20} style={{ color: '#f97316' }} />
          </button>
        </div>
      </div>

      {/* Vehicles Badge */}
      {customer.vehicles && customer.vehicles.length > 0 && (
        <div className="mb-4 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={16} style={{ color: '#f97316' }} />
            <span className="text-xs font-bold text-gray-300 uppercase">{customer.vehicles.length} Vehicle{customer.vehicles.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {customer.vehicles.slice(0, 2).map((v) => (
              <span key={v.id} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-gray-800 text-orange-400">
                <MapPin size={12} />
                {v.plate}
              </span>
            ))}
            {customer.vehicles.length > 2 && (
              <span className="text-xs font-semibold px-3 py-1 text-gray-400">+{customer.vehicles.length - 2}</span>
            )}
          </div>
        </div>
      )}

      {/* Service Status Alerts */}
      {!loading && hasServiceStatus && (
        <div className="mb-3 space-y-2 relative z-10">
          {/* In Service */}
          {serviceStatus.inService.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-900/30 border border-yellow-700/50">
              <Clock size={14} style={{ color: '#eab308' }} className="flex-shrink-0" />
              <span className="text-xs font-semibold text-yellow-300">
                {serviceStatus.inService.length} vehicle{serviceStatus.inService.length > 1 ? 's' : ''} in service
              </span>
            </div>
          )}

          {/* Ready for Pickup */}
          {serviceStatus.readyForPickup.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/30 border border-green-700/50">
              <CheckCircle size={14} style={{ color: '#10b981' }} className="flex-shrink-0" />
              <span className="text-xs font-semibold text-green-300">
                {serviceStatus.readyForPickup.length} vehicle{serviceStatus.readyForPickup.length > 1 ? 's' : ''} ready
              </span>
            </div>
          )}
        </div>
      )}

      {/* Balance Alert */}
      {!loading && hasDebt && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/30 border border-red-700/50 relative z-10">
          <DollarSign size={14} style={{ color: '#ef4444' }} className="flex-shrink-0" />
          <span className="text-xs font-semibold text-red-300">
            Balance due: {customerBalance.debt.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-700 text-xs text-gray-500 relative z-10">
        Member since {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
}
