import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreVertical, Phone, MapPin, Truck, AlertCircle, User, CreditCard, Wrench, Edit2, X, Check, DollarSign, Wallet } from 'lucide-react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import Field, { inputCls } from '../components/ui/Field';
import Modal from '../components/ui/Modal';
import { CustomersSkeleton, CustomerDetailSkeleton } from '../components/ui/Skeletons';
import CreateWorkOrderModal from '../components/CreateWorkOrderModal';
import { customersService } from '../services/customers.service';
import { vehiclesService } from '../services/vehicles.service';
import { paymentsService } from '../services/payments.service';
import type { Customer, Vehicle } from '../types';

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/, 'Invalid US phone'),
});

const vehicleSchema = z.object({
  plate: z.string().min(1, 'Plate is required'),
  model: z.string().min(1, 'Model is required'),
  description: z.string().optional(),
});

export default function Customers() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Customer | null>(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerWorkOrders, setCustomerWorkOrders] = useState<any[]>([]);
  const [customerBalance, setCustomerBalance] = useState({ total: 0, paid: 0, debt: 0 });
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const customerForm = useForm({ resolver: zodResolver(customerSchema) });
  const vehicleForm = useForm({ resolver: zodResolver(vehicleSchema) });
  
  // Create payment schema dynamically with access to customerBalance
  const createPaymentSchema = (maxAmount: number) => z.object({
    amount: z.number()
      .refine(val => val > 0, 'Amount must be greater than $0.00')
      .refine(val => val >= 0.01, 'Amount must be at least $0.01')
      .refine(val => val <= maxAmount, `Cannot exceed amount due ($${maxAmount.toFixed(2)})`),
    method: z.enum(['zelle', 'card', 'cash']),
    date: z.string(),
  });

  const paymentForm = useForm({ 
    resolver: zodResolver(createPaymentSchema(customerBalance.debt))
  });
  const [vehiclesToAdd, setVehiclesToAdd] = useState<Array<{ plate: string; model: string; description?: string }>>([]);
  const [existingVehicles, setExistingVehicles] = useState<Array<{ id: string; plate: string; model: string; description?: string }>>([]);
  const [editingVehicle, setEditingVehicle] = useState<{ id: string; plate: string; model: string; description?: string } | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersService.findAll(),
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (values: any) => {
      const customer = await (editingCustomer ? customersService.update(editingCustomer.id, values) : customersService.create(values));
      
      // Actualizar todos los vehículos existentes que fueron modificados
      for (const vehicle of existingVehicles) {
        await vehiclesService.update(vehicle.id, {
          plate: vehicle.plate,
          model: vehicle.model,
          description: vehicle.description || '',
        });
      }

      // Crear vehículos nuevos
      if (vehiclesToAdd.length > 0) {
        for (const vehicle of vehiclesToAdd) {
          await vehiclesService.create({
            customer_id: customer.id,
            plate: vehicle.plate,
            model: vehicle.model,
            description: vehicle.description || '',
          });
        }
      }
      
      return customer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setShowCreateModal(false);
      customerForm.reset();
      vehicleForm.reset();
      setVehiclesToAdd([]);
      setExistingVehicles([]);
      setEditingVehicle(null);
      setEditingCustomer(null);
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => customersService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setShowDeleteConfirm(null);
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!selectedCustomer || customerWorkOrders.length === 0) throw new Error('No work order');
      return paymentsService.create(customerWorkOrders[0].id, values.amount, values.method, values.date);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setShowPaymentModal(false);
      paymentForm.reset();
      if (selectedCustomer) loadCustomerDetail(selectedCustomer);
    },
  });

  const loadCustomerDetail = async (customer: Customer) => {
    setLoadingDetail(true);
    try {
      const vdata = await vehiclesService.findByCustomer(customer.id);
      setVehicles(vdata);
      
      const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000' });
      api.interceptors.request.use((config) => {
        const token = localStorage.getItem('access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      });

      const allWorkOrders = await api.get('/work-orders').then(res => res.data);
      const filtered = allWorkOrders.filter((wo: any) => wo.vehicle?.customer_id === customer.id);
      setCustomerWorkOrders(filtered);

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
      setVehicles([]);
      setCustomerWorkOrders([]);
      setCustomerBalance({ total: 0, paid: 0, debt: 0 });
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase();
      const plates = c.vehicles?.map(v => v.plate.toLowerCase()).join('|') || '';
      return c.name.toLowerCase().includes(q) || c.phone.includes(q) || plates.includes(q);
    });
  }, [customers, searchQuery]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setActiveDropdown(null);
      }
    };
    
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>{t('customers.title')}</h1>
        <button onClick={() => { setEditingCustomer(null); customerForm.reset({ name: '', phone: '' }); setVehiclesToAdd([]); setShowCreateModal(true); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer inline-flex items-center gap-2" style={{ backgroundColor: '#f97316' }}>
          <Plus size={16} />
          {t('customers.new')}
        </button>
      </div>

      <div className="mb-6 space-y-3">
        <input type="text" placeholder="Search by name, phone, or plate..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
      </div>

      {isLoading ? <CustomersSkeleton /> : filteredCustomers.length === 0 ? <div className="text-center py-12 text-gray-500">No customers found</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id} 
              onClick={() => { setSelectedCustomer(customer); loadCustomerDetail(customer); setShowDetailModal(true); }} 
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
                <div onClick={(e) => e.stopPropagation()} data-dropdown>
                  <button 
                    ref={(el) => { dropdownRefs.current[customer.id] = el; }}
                    onClick={(e) => { 
                      e.stopPropagation();
                      if (activeDropdown !== customer.id) {
                        const btn = dropdownRefs.current[customer.id];
                        if (btn) {
                          const rect = btn.getBoundingClientRect();
                          setDropdownPos({ top: rect.bottom + 8, left: rect.left - 140 });
                        }
                        setSelectedCustomer(customer);
                      }
                      setActiveDropdown(activeDropdown === customer.id ? null : customer.id); 
                    }} 
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

              {/* Footer */}
              <div className="pt-4 border-t border-gray-700 text-xs text-gray-500 relative z-10">
                Member since {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <Modal title={editingCustomer ? '✏️ Edit Customer' : '➕ New Customer'} onClose={() => { setShowCreateModal(false); setVehiclesToAdd([]); }} size="lg">
          <form onSubmit={customerForm.handleSubmit((data) => createCustomerMutation.mutate(data))} className="space-y-6">
            {/* Customer Info Section */}
            <div>
              <h3 className="text-sm font-bold mb-4" style={{ color: '#0f1f3d' }}>Customer Information</h3>
              <div className="space-y-4">
                <Field label="Full Name" error={customerForm.formState.errors.name?.message}>
                  <input {...customerForm.register('name')} className={`${inputCls(!!customerForm.formState.errors.name)} text-base px-4 py-3 rounded-lg`} placeholder="John Doe" />
                </Field>
                <Field label="Phone Number" error={customerForm.formState.errors.phone?.message}>
                  <input 
                    {...customerForm.register('phone')} 
                    className={`${inputCls(!!customerForm.formState.errors.phone)} text-base px-4 py-3 rounded-lg`} 
                    placeholder="(305) 555-1234"
                    onChange={(e) => {
                      // Format phone number as user types
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 0) {
                        if (value.length <= 3) {
                          value = `(${value}`;
                        } else if (value.length <= 6) {
                          value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                        } else {
                          value = `(${value.slice(0, 3)}) ${value.slice(3, 6)} ${value.slice(6, 10)}`;
                        }
                      }
                      customerForm.setValue('phone', value);
                    }}
                  />
                </Field>
              </div>
            </div>

            {/* Vehicles Section */}
            <div className="border-t-2 border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold" style={{ color: '#0f1f3d' }}>
                    <Truck size={18} className="inline mr-2" style={{ color: '#f97316' }} />
                    {editingCustomer ? 'Vehicles & Management' : 'Add Vehicles (Optional)'}
                  </h3>
                  {(vehiclesToAdd.length > 0 || (editingCustomer && existingVehicles.length > 0)) && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white animate-pulse" style={{ backgroundColor: '#f97316' }}>
                      {(existingVehicles.length || 0) + vehiclesToAdd.length} total
                    </span>
                  )}
                </div>

                {/* Existing Vehicles - Only show when editing */}
                {editingCustomer && existingVehicles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Registered Vehicles</p>
                    <div className="space-y-2">
                      {existingVehicles.map((vehicle) => (
                        <div key={vehicle.id} className="flex items-center justify-between bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border-l-4 border-green-400">
                          <div className="flex items-center gap-3 flex-1">
                            <Truck size={16} style={{ color: '#10b981' }} className="flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm" style={{ color: '#0f1f3d' }}>{vehicle.plate}</p>
                              <p className="text-xs text-gray-600">{vehicle.model}</p>
                              {vehicle.description && <p className="text-xs text-gray-500 italic mt-1">{vehicle.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingVehicle(editingVehicle?.id === vehicle.id ? null : vehicle)}
                              className="p-2 rounded hover:bg-green-200 transition-colors cursor-pointer"
                              title={editingVehicle?.id === vehicle.id ? 'Close' : 'Edit'}
                            >
                              {editingVehicle?.id === vehicle.id ? (
                                <X size={16} style={{ color: '#ef4444' }} />
                              ) : (
                                <Edit2 size={16} style={{ color: '#10b981' }} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setExistingVehicles(existingVehicles.filter(v => v.id !== vehicle.id))}
                              className="text-2xl text-red-500 hover:text-red-700 transition-colors cursor-pointer font-light leading-none"
                              title="Delete"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add vehicle form OR Edit form */}
                {editingVehicle && editingCustomer ? (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-5 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-orange-900 uppercase tracking-wide">Edit {editingVehicle.plate}</p>
                      <button
                        type="button"
                        onClick={() => setEditingVehicle(null)}
                        className="p-1 hover:bg-orange-200 rounded transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X size={18} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="License Plate">
                        <input
                          type="text"
                          value={editingVehicle.plate}
                          onChange={(e) => {
                            const updated = { ...editingVehicle, plate: e.target.value };
                            setEditingVehicle(updated);
                            setExistingVehicles(existingVehicles.map(v => v.id === editingVehicle.id ? updated : v));
                          }}
                          className="text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="ABC-1234"
                        />
                      </Field>
                      <Field label="Model">
                        <input
                          type="text"
                          value={editingVehicle.model}
                          onChange={(e) => {
                            const updated = { ...editingVehicle, model: e.target.value };
                            setEditingVehicle(updated);
                            setExistingVehicles(existingVehicles.map(v => v.id === editingVehicle.id ? updated : v));
                          }}
                          className="text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="2020 Toyota Camry"
                        />
                      </Field>
                    </div>
                    <Field label="Description">
                      <input
                        type="text"
                        value={editingVehicle.description || ''}
                        onChange={(e) => {
                          const updated = { ...editingVehicle, description: e.target.value };
                          setEditingVehicle(updated);
                          setExistingVehicles(existingVehicles.map(v => v.id === editingVehicle.id ? updated : v));
                        }}
                        className="text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
                        placeholder="e.g., Red, has dent on left side"
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => setEditingVehicle(null)}
                      className="w-full px-3 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#10b981' }}
                    >
                      <Check size={16} />
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 space-y-4">
                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Add a new vehicle</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="License Plate" error={vehicleForm.formState.errors.plate?.message}>
                        <input
                          {...vehicleForm.register('plate')}
                          className={`${inputCls(!!vehicleForm.formState.errors.plate)} text-sm px-3 py-2 rounded-lg`}
                          placeholder="ABC-1234"
                        />
                      </Field>
                      <Field label="Model" error={vehicleForm.formState.errors.model?.message}>
                        <input
                          {...vehicleForm.register('model')}
                          className={`${inputCls(!!vehicleForm.formState.errors.model)} text-sm px-3 py-2 rounded-lg`}
                          placeholder="2020 Toyota Camry"
                        />
                      </Field>
                    </div>
                    <Field label="Description (optional)" error={vehicleForm.formState.errors.description?.message}>
                      <input
                        {...vehicleForm.register('description')}
                        className={inputCls(!!vehicleForm.formState.errors.description)}
                        placeholder="e.g., Red, has dent on left side"
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={async () => {
                        const isValid = await vehicleForm.trigger();
                        if (isValid) {
                          const data = vehicleForm.getValues();
                          setVehiclesToAdd([...vehiclesToAdd, data]);
                          vehicleForm.reset({ plate: '', model: '', description: '' });
                        }
                      }}
                      className="w-full px-4 py-2.5 text-sm rounded-lg text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#f97316' }}
                    >
                      <Plus size={16} />
                      Add Vehicle
                    </button>
                  </div>
                )}
              </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => { setShowCreateModal(false); setVehiclesToAdd([]); }} className="px-6 py-2.5 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-semibold">Cancel</button>
              <button type="submit" disabled={createCustomerMutation.isPending} className="px-6 py-2.5 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity" style={{ backgroundColor: '#f97316' }}>{createCustomerMutation.isPending ? 'Saving...' : editingCustomer ? 'Update' : 'Create Customer'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showDetailModal && selectedCustomer && (
        <Modal title={`${selectedCustomer.name}`} onClose={() => { setShowDetailModal(false); setActiveDropdown(null); }} size="lg">
          {loadingDetail ? <CustomerDetailSkeleton /> : (
            <div className="space-y-5">
              {/* Contact Card */}
              <div className="bg-white rounded-xl p-5 border-l-4" style={{ borderLeftColor: '#f97316' }}>
                <div className="flex items-start gap-3">
                  <User size={24} style={{ color: '#f97316' }} className="flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-base mb-3" style={{ color: '#0f1f3d' }}>Contact Information</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Name</p>
                        <p className="font-bold text-sm mt-1" style={{ color: '#0f1f3d' }}>{selectedCustomer.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Phone</p>
                        <p className="font-bold text-sm mt-1 flex items-center gap-2"><Phone size={16} style={{ color: '#f97316' }} /> {selectedCustomer.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Summary - ROW */}
              <div className="bg-white rounded-xl p-5 border-l-4" style={{ borderLeftColor: '#f97316' }}>
                <div className="flex items-start gap-3 mb-4">
                  <CreditCard size={24} style={{ color: '#f97316' }} className="flex-shrink-0 mt-0.5" />
                  <h3 className="font-bold text-base" style={{ color: '#0f1f3d' }}>Account Balance</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg text-center border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Total</p>
                    <p className="font-bold text-lg" style={{ color: '#0f1f3d' }}>{formatCurrency(customerBalance.total)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Paid</p>
                    <p className="font-bold text-lg text-green-600">{formatCurrency(customerBalance.paid)}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${customerBalance.debt > 0 ? 'from-red-50 to-red-100' : 'from-green-50 to-green-100'} p-4 rounded-lg text-center ${customerBalance.debt > 0 ? 'border border-red-200' : 'border border-green-200'}`}>
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Due</p>
                    <p className={`font-bold text-lg ${customerBalance.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(customerBalance.debt)}</p>
                  </div>
                </div>
              </div>

              {/* Vehicles */}
              <div className="bg-white rounded-xl p-5 border-l-4" style={{ borderLeftColor: '#f97316' }}>
                <div className="flex items-start gap-3 mb-4">
                  <Truck size={24} style={{ color: '#f97316' }} className="flex-shrink-0 mt-0.5" />
                  <h3 className="font-bold text-base" style={{ color: '#0f1f3d' }}>Vehicles</h3>
                </div>
                {vehicles.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No vehicles registered</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="bg-gray-50 p-3 rounded-lg border-l-2" style={{ borderLeftColor: '#f97316' }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm" style={{ color: '#0f1f3d' }}>{vehicle.plate}</p>
                            <p className="text-xs text-gray-600 mt-1">{vehicle.model}</p>
                            {vehicle.description && <p className="text-xs text-gray-500 mt-1 italic">{vehicle.description}</p>}
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
                  <h3 className="font-bold text-base" style={{ color: '#0f1f3d' }}>Recent Orders</h3>
                </div>
                {customerWorkOrders.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p>No work orders found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {customerWorkOrders.slice(0, 8).map((wo: any) => {
                      const subtotal = Number(wo.subtotal);
                      const taxRate = Number(wo.tax_rate);
                      const total = subtotal + (subtotal * taxRate);
                      return (
                        <div key={wo.id} className="bg-gray-50 p-3 rounded-lg border-l-2 hover:shadow-md transition-shadow" style={{ borderLeftColor: '#10b981' }}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm" style={{ color: '#0f1f3d' }}>Order #{wo.order_number || wo.id.slice(0, 8)}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(wo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-white text-xs font-bold text-nowrap ml-2" style={{ backgroundColor: '#10b981' }}>{total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
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
            <button onClick={() => { setShowDetailModal(false); setActiveDropdown(null); }} className="px-6 py-2 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-semibold">Close</button>
          </div>
        </Modal>
      )}

      {showPaymentModal && selectedCustomer && (
        <Modal title={`Register Payment - ${selectedCustomer.name}`} onClose={() => setShowPaymentModal(false)} size="lg">
          <form onSubmit={paymentForm.handleSubmit((data) => createPaymentMutation.mutate(data))} className="space-y-6">
            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl p-5">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Account Overview</p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 uppercase font-semibold">Total Due</p>
                      <p className="font-bold text-lg text-blue-600 mt-1">{formatCurrency(customerBalance.debt)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 uppercase font-semibold">Total Paid</p>
                      <p className="font-bold text-lg text-green-600 mt-1">{formatCurrency(customerBalance.paid)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 uppercase font-semibold">Total Invoiced</p>
                      <p className="font-bold text-lg text-gray-700 mt-1">{formatCurrency(customerBalance.total)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Payment Details</p>

              {/* Amount */}
              <div>
                <Field label="Amount" error={paymentForm.formState.errors.amount?.message}>
                  <div className="relative">
                    <DollarSign size={20} className="absolute left-3 top-3.5" style={{ color: '#f97316' }} />
                    <input 
                      {...paymentForm.register('amount', { 
                        valueAsNumber: true,
                        setValueAs: (val) => {
                          const num = parseFloat(val);
                          return isNaN(num) ? 0 : num;
                        }
                      })}
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      onBlur={() => paymentForm.trigger('amount')}
                      className={`${inputCls(!!paymentForm.formState.errors.amount)} text-base px-4 pl-10 py-3 rounded-lg w-full`} 
                      placeholder="0.00" 
                    />
                  </div>
                </Field>
              </div>

              {/* Payment Method */}
              <div>
                <Field label="Payment Method" error={paymentForm.formState.errors.method?.message}>
                  <div className="relative">
                    <select 
                      {...paymentForm.register('method')} 
                      onBlur={() => paymentForm.trigger('method')}
                      className={`${inputCls(!!paymentForm.formState.errors.method)} text-base px-4 py-3 rounded-lg w-full appearance-none cursor-pointer bg-white`}
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
                <Field label="Payment Date" error={paymentForm.formState.errors.date?.message}>
                  <input 
                    {...paymentForm.register('date')} 
                    type="date" 
                    onBlur={() => paymentForm.trigger('date')}
                    className={`${inputCls(!!paymentForm.formState.errors.date)} text-base px-4 py-3 rounded-lg w-full`}
                  />
                </Field>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => setShowPaymentModal(false)} 
                className="px-6 py-2.5 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createPaymentMutation.isPending} 
                className="px-6 py-2.5 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity inline-flex items-center gap-2"
                style={{ backgroundColor: '#f97316' }}
              >
                <CreditCard size={16} />
                {createPaymentMutation.isPending ? 'Processing...' : 'Register Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal title="🗑️ Delete Customer" onClose={() => setShowDeleteConfirm(null)}>
          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <p className="text-sm font-semibold text-red-900">Are you sure?</p>
                <p className="text-sm text-red-800 mt-1">You're about to delete <strong>{showDeleteConfirm.name}</strong>. This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-6 py-2.5 text-sm rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors font-semibold">Cancel</button>
              <button onClick={() => { if (showDeleteConfirm) deleteCustomerMutation.mutate(showDeleteConfirm.id); }} disabled={deleteCustomerMutation.isPending} className="px-6 py-2.5 text-sm rounded-lg text-white font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60 cursor-pointer transition-colors">{deleteCustomerMutation.isPending ? 'Deleting...' : 'Delete Customer'}</button>
            </div>
          </div>
        </Modal>
      )}

      <CreateWorkOrderModal isOpen={showWorkOrderModal} onClose={() => setShowWorkOrderModal(false)} customerId={selectedCustomer?.id} />

      {activeDropdown && createPortal(
        <div className="fixed bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px`, pointerEvents: 'auto', zIndex: 99999 }}>
          <button onClick={(e) => { e.stopPropagation(); setShowWorkOrderModal(true); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer whitespace-nowrap">Create Work Order</button>
          <button onClick={(e) => { e.stopPropagation(); paymentForm.reset({ amount: 0, method: 'cash', date: new Date().toISOString().split('T')[0] }); setShowPaymentModal(true); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer whitespace-nowrap">Register Payment</button>
          <button onClick={(e) => { e.stopPropagation(); setEditingCustomer(selectedCustomer); if (selectedCustomer) { customerForm.reset({ name: selectedCustomer.name, phone: selectedCustomer.phone }); setExistingVehicles(vehicles.map(v => ({ id: v.id, plate: v.plate, model: v.model, description: v.description })) || []); } setVehiclesToAdd([]); setEditingVehicle(null); setShowCreateModal(true); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(selectedCustomer); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap">Delete</button>
        </div>,
        document.body
      )}
    </Layout>
  );
}
