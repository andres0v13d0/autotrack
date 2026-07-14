import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import WorkOrderFilters from '../components/WorkOrderFilters';
import type { TableColumn } from '../components/ui/Table';
import { workOrdersService } from '../services/workOrders.service';
import { vehiclesService } from '../services/vehicles.service';
import { customersService } from '../services/customers.service';
import { paymentsService } from '../services/payments.service';
import { pdfService } from '../services/pdf.service';
import type { WorkOrder } from '../types/workOrder';
import type { Vehicle } from '../types';
import { Plus, Circle, Clock, CheckCircle2, Check } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Field, { inputCls } from '../components/ui/Field';

const createOrderSchema = z.object({
  customer_id: z.string().min(1, 'Select a customer'),
  vehicle_id: z.string().min(1, 'Select a vehicle'),
  description_needed: z.string().min(3, 'Description required'),
});
type CreateOrderValues = z.infer<typeof createOrderSchema>;

interface ItemForm {
  name: string;
  price: string;
  qty: string;
}

export default function WorkOrders() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<'new' | 'in_progress' | 'ready' | 'delivered' | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'pending' | 'partial' | 'paid' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalDeliveryStatus, setModalDeliveryStatus] = useState<'new' | 'in_progress' | 'ready' | 'delivered'>('new');
  const [editingItems, setEditingItems] = useState<Record<string, { price: string; qty: string }>>({});
  const [amountToPay, setAmountToPay] = useState<string>('');
  const [taxRate, setTaxRate] = useState<string>('0');
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: async () => {
      try {
        return await workOrdersService.findAll();
      } catch {
        return [];
      }
    },
  });

  const { data: selectedOrder } = useQuery({
    queryKey: ['work-order', selectedWorkOrderId],
    queryFn: () => selectedWorkOrderId ? workOrdersService.getOne(selectedWorkOrderId) : null,
    enabled: !!selectedWorkOrderId && showDetailModal,
  });

  const { data: balance } = useQuery({
    queryKey: ['order-balance', selectedWorkOrderId],
    queryFn: () => selectedWorkOrderId ? paymentsService.getOrderBalance(selectedWorkOrderId) : null,
    enabled: !!selectedWorkOrderId && showDetailModal,
  });

  const { register: registerCreate, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: createErrors } } = useForm<CreateOrderValues>({
    resolver: zodResolver(createOrderSchema),
  });

  const { register: registerItem, handleSubmit: handleItemSubmit, reset: resetItem, formState: { errors: itemErrors }, watch: watchItem } = useForm<ItemForm>({
    defaultValues: { qty: '1' },
  });

  const handleSaveAndDownloadPdf = async () => {
    if (!selectedWorkOrderId) {
      console.error('No work order selected');
      return;
    }

    try {
      // Guardar el pago si hay monto
      if (amountToPay) {
        const paymentAmount = parseFloat(amountToPay);
        if (paymentAmount > 0) {
          console.log('Creating payment:', paymentAmount);
          await paymentsService.create(
            selectedWorkOrderId,
            paymentAmount,
            'cash',
            new Date().toISOString().split('T')[0]
          );
        }
      }

      // Generar y descargar PDF con tax rate
      console.log('Downloading PDF for order:', selectedWorkOrderId, 'with tax rate:', taxRate);
      await pdfService.downloadWorkOrderPdf(selectedWorkOrderId, parseFloat(taxRate) / 100);

      // Cerrar modal y limpiar
      setShowDetailModal(false);
      setSelectedWorkOrderId(null);
      resetItem();
      setAmountToPay('');
      setTaxRate('0');
      
      // Refrescar datos
      qc.invalidateQueries({ queryKey: ['workOrders'] });
      qc.invalidateQueries({ queryKey: ['work-order', selectedWorkOrderId] });
    } catch (error) {
      console.error('Error saving payment or generating PDF:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const createMutation = useMutation({
    mutationFn: async (values: CreateOrderValues) => {
      return workOrdersService.create(values.vehicle_id, values.description_needed);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workOrders'] });
      setShowCreateModal(false);
      resetCreate();
    },
  });

  const addItemMutation = useMutation({
    mutationFn: (values: ItemForm) =>
      selectedWorkOrderId ? workOrdersService.addItem(selectedWorkOrderId, {
        name: values.name,
        price: parseFloat(values.price),
        qty: parseInt(values.qty, 10),
      }) : Promise.reject('No work order selected'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-order', selectedWorkOrderId] });
      resetItem({ name: '', price: '', qty: '1' });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      selectedWorkOrderId ? workOrdersService.removeItem(selectedWorkOrderId, itemId) : Promise.reject('No work order selected'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-order', selectedWorkOrderId] });
    },
  });

  const handleSearchCustomer = async (query: string) => {
    setCustomerSearch(query);
    setShowCustomerDropdown(true);

    if (query.length < 1) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const allCustomers = await customersService.findAll();
      const filtered = allCustomers.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query)
      );
      setCustomerSuggestions(filtered);
    } catch {
      setCustomerSuggestions([]);
    }
  };

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.name} (${customer.phone})`);
    setShowCustomerDropdown(false);
    setLoadingVehicles(true);

    try {
      const customerVehicles = await vehiclesService.findByCustomer(customer.id);
      setVehicles(customerVehicles);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleResetCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setVehicles([]);
    setCustomerSuggestions([]);
  };

  const handleViewOrder = (workOrderId: string) => {
    setSelectedWorkOrderId(workOrderId);
    setTaxRate('0');
    setShowDetailModal(true);
  };

  // For now, just filter by delivery status since payment status requires additional queries
  const filteredWorkOrders = workOrders.filter(order => {
    const deliveryMatch = deliveryStatusFilter === 'all' || order.delivery_status === deliveryStatusFilter;
    const searchMatch = !searchQuery || 
      order.order_number?.toString().includes(searchQuery) ||
      order.vehicle?.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vehicle?.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.description_needed?.toLowerCase().includes(searchQuery.toLowerCase());
    return deliveryMatch && searchMatch;
  });

  const columns: TableColumn<WorkOrder>[] = [
    {
      key: 'delivery_status',
      label: '',
      width: '5%',
      render: (value: unknown) => {
        const status = value as string;
        const iconProps = { size: 18 };
        let icon: React.ReactElement;
        switch (status) {
          case 'new':
            icon = <div className="w-4 h-4 rounded-full border-2 border-slate-900 bg-white" />;
            break;
          case 'in_progress':
            icon = <Clock {...iconProps} className="text-orange-500" />;
            break;
          case 'ready':
            icon = <CheckCircle2 {...iconProps} className="text-blue-500" />;
            break;
          case 'delivered':
            icon = <Check {...iconProps} className="text-emerald-500" />;
            break;
          default:
            icon = <Circle {...iconProps} className="text-slate-400" />;
        }
        return <div className="flex items-center justify-center">{icon}</div>;
      },
    },
    {
      key: 'order_number',
      label: 'Order #',
      width: '10%',
      render: (value: unknown) => `#${value}`,
    },
    {
      key: 'vehicle_plate',
      label: t('vehicles.plate'),
      width: '15%',
      render: (_value: unknown, row: WorkOrder) => {
        if (row.vehicle?.plate) return row.vehicle.plate;
        return 'N/A';
      },
    },
    {
      key: 'vehicle_model',
      label: t('vehicles.model'),
      width: '18%',
      render: (_value: unknown, row: WorkOrder) => {
        if (row.vehicle?.model) return row.vehicle.model;
        return 'N/A';
      },
    },
    {
      key: 'description_needed',
      label: 'Description',
      width: '20%',
      render: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'N/A';
        return value.length > 30 ? `${value.substring(0, 30)}...` : value;
      },
    },
    {
      key: 'total',
      label: 'Total',
      width: '12%',
      render: (value: unknown) => {
        const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
        if (isNaN(num)) return '$0.00';
        return `$${num.toFixed(2)}`;
      },
    },
    {
      key: 'created_at',
      label: t('customers.createdAt'),
      width: '13%',
      render: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'N/A';
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return 'N/A';
        }
      },
    },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>
          {t('nav.workOrders')}
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer inline-flex items-center gap-2"
          style={{ backgroundColor: '#f97316' }}
        >
          <Plus size={16} />
          New Order
        </button>
      </div>

      {/* Delivery Status Filters */}
      <WorkOrderFilters
        deliveryStatus={deliveryStatusFilter}
        paymentStatus={paymentStatusFilter}
        onDeliveryStatusChange={setDeliveryStatusFilter}
        onPaymentStatusChange={setPaymentStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <Table<WorkOrder>
        columns={columns}
        data={filteredWorkOrders}
        isLoading={isLoading}
        emptyMessage="No work orders found"
        rowKey="id"
        onRowClick={(row) => handleViewOrder(row.id)}
      />

      {/* Create Order Modal */}
      {showCreateModal && (
        <Modal 
          title="New Work Order"
          onClose={() => {
            setShowCreateModal(false);
            resetCreate();
            setVehicles([]);
            handleResetCustomer();
          }}
          size="md"
        >
          <form onSubmit={handleCreateSubmit((v) => {
            if (!selectedCustomer) {
              console.error('No customer selected');
              return;
            }
            createMutation.mutate({ ...v, customer_id: selectedCustomer.id });
          })} className="space-y-4">
            {/* Customer Search */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-900">Customer</label>
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => handleResetCustomer()}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {!selectedCustomer ? (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search customer by name or phone..."
                    value={customerSearch}
                    onChange={(e) => handleSearchCustomer(e.target.value)}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-red-300 focus:outline-none focus:border-red-500 text-base"
                  />
                  <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <div className="w-1 h-1 bg-red-600 rounded-full" />
                    Please select a customer
                  </div>

                  {showCustomerDropdown && customerSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {customerSuggestions.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleSelectCustomer(customer)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer"
                        >
                          <div className="font-semibold text-slate-900">{customer.name}</div>
                          <div className="text-xs text-slate-600">{customer.phone}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showCustomerDropdown && customerSearch.length > 0 && customerSuggestions.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4 text-center text-sm text-slate-600">
                      No customers found
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 bg-green-50 border-2 border-green-300 rounded-lg">
                  <div className="font-semibold text-green-900">{selectedCustomer.name}</div>
                  <div className="text-sm text-green-700">{selectedCustomer.phone}</div>
                </div>
              )}
            </div>

            {/* Vehicle Select */}
            <Field label={t('vehicles.plate')} error={createErrors.vehicle_id?.message}>
              <select
                {...registerCreate('vehicle_id')}
                className={inputCls(!!createErrors.vehicle_id || (selectedCustomer && vehicles.length === 0))}
                disabled={!selectedCustomer || loadingVehicles || vehicles.length === 0}
              >
                <option value="">
                  {!selectedCustomer ? 'Select a customer first' : 
                   loadingVehicles ? 'Loading vehicles...' : 
                   vehicles.length === 0 ? 'No vehicles found' : 
                   'Select a vehicle'}
                </option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} - {v.model}
                  </option>
                ))}
              </select>
            </Field>

            {/* Description */}
            <Field label="Description" error={createErrors.description_needed?.message}>
              <textarea
                {...registerCreate('description_needed')}
                className={`${inputCls(!!createErrors.description_needed)} min-h-20 resize-none`}
                placeholder="What needs to be done?"
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreate();
                  setVehicles([]);
                  handleResetCustomer();
                }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer transition-opacity"
                style={{ backgroundColor: '#f97316' }}
              >
                {createMutation.isPending ? '...' : 'Create Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Work Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <Modal
          title={`Order #${selectedOrder.order_number || 'N/A'}`}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedWorkOrderId(null);
            resetItem();
            setAmountToPay('');
          }}
          size="xl"
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedWorkOrderId(null);
                  resetItem();
                  setAmountToPay('');
                }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAndDownloadPdf}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 cursor-pointer transition-opacity"
                style={{ backgroundColor: '#f97316' }}
              >
                Save & Open PDF
              </button>
            </div>
          }
        >
          <div className="space-y-6 max-h-[85vh] overflow-y-auto">

            {/* Vehicle Details & Delivery Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pb-6 border-b-2 border-gray-200">
              <div className="md:col-span-2 space-y-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Vehicle Details</p>
                <div className="grid grid-cols-2 md:flex md:items-center md:gap-8 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Plate</p>
                    <p className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>{selectedOrder.vehicle?.plate || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Model</p>
                    <p className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>{selectedOrder.vehicle?.model || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-xs text-gray-600 font-medium mb-1">Customer</p>
                    <p className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>{selectedOrder.vehicle?.customer?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Delivery Status</p>
                <select 
                  value={modalDeliveryStatus} 
                  onChange={(e) => setModalDeliveryStatus(e.target.value as any)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg border-2 border-slate-200 bg-white hover:border-slate-300 transition-colors w-full"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            {/* Items Section - Invoice Style */}
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ color: '#0f1f3d' }}>Items</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">{t('workOrders.description')}</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">{t('workOrders.price')}</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">{t('workOrders.qty')}</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">{t('workOrders.lineTotal')}</th>
                      {selectedOrder.items.length > 0 && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Existing Items - Editable Rows */}
                    {selectedOrder.items.map((item, idx) => {
                      const edited = editingItems[item.id];
                      const price = edited ? parseFloat(edited.price) : (typeof item.price === 'string' ? parseFloat(item.price) : item.price);
                      const qty = edited ? parseInt(edited.qty, 10) : item.qty;
                      const lineTotal = (price * qty).toFixed(2);

                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">
                            <input 
                              type="text"
                              defaultValue={item.name}
                              className="text-xs w-full px-2 py-1 border border-gray-300 rounded"
                              readOnly
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number"
                              step="0.01"
                              value={edited?.price ?? (typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2))}
                              onChange={(e) => setEditingItems({ ...editingItems, [item.id]: { ...edited, price: e.target.value } })}
                              className="text-xs w-full px-2 py-1 border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="number"
                              min="1"
                              value={edited?.qty ?? item.qty}
                              onChange={(e) => setEditingItems({ ...editingItems, [item.id]: { ...edited, qty: e.target.value } })}
                              className="text-xs w-full px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-xs font-bold text-gray-900">
                              ${lineTotal}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeItemMutation.mutate(item.id)}
                              className="text-lg text-red-600 hover:text-red-800 transition-colors cursor-pointer font-bold"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* New Item Input Row - Always Visible */}
                    {(() => {
                      const newPrice = parseFloat(watchItem('price') || '0') || 0;
                      const newQty = parseInt(watchItem('qty') || '1', 10) || 1;
                      const newLineTotal = (newPrice * newQty).toFixed(2);
                      
                      return (
                        <tr className="bg-blue-50">
                          <td className="px-4 py-3">
                            <input 
                              {...registerItem('name')} 
                              className={`${inputCls(!!itemErrors.name)} text-xs w-full`} 
                              placeholder="Description" 
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              {...registerItem('price')} 
                              type="number" 
                              step="0.01" 
                              min="0.01" 
                              className={`${inputCls(!!itemErrors.price)} text-xs w-full text-right`} 
                              placeholder="0.00" 
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              {...registerItem('qty')} 
                              type="number" 
                              min="1" 
                              className={`${inputCls(!!itemErrors.qty)} text-xs w-full text-center`} 
                              placeholder="1" 
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-xs font-medium text-gray-900">
                              ${newLineTotal}
                            </div>
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Add Item Link - Outside Table */}
              <div className="mt-3 text-right">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleItemSubmit((v) => addItemMutation.mutate(v))();
                    itemNameInputRef.current?.focus();
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  + Add Item
                </a>
              </div>

              {/* Hidden form for item submission */}
              <form onSubmit={handleItemSubmit((v) => addItemMutation.mutate(v))} className="hidden" />
            </div>

            {/* Totals Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-300 rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: '#0f1f3d' }}>Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">${typeof selectedOrder.subtotal === 'string' ? parseFloat(selectedOrder.subtotal).toFixed(2) : selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Tax</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-xs"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <span className="font-semibold text-gray-900">${typeof selectedOrder.tax === 'string' ? parseFloat(selectedOrder.tax).toFixed(2) : selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center font-bold">
                  <span style={{ color: '#0f1f3d' }}>Total Due</span>
                  <span style={{ color: '#f97316' }} className="text-lg">${typeof selectedOrder.total === 'string' ? parseFloat(selectedOrder.total).toFixed(2) : selectedOrder.total.toFixed(2)}</span>
                </div>
                {balance && (
                  <>
                    <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center text-xs gap-2">
                      <span className="text-gray-600">Amount Paid</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={(typeof selectedOrder.total === 'string' ? parseFloat(selectedOrder.total) : selectedOrder.total).toFixed(2)}
                          value={amountToPay}
                          onChange={(e) => setAmountToPay(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-xs text-right font-semibold text-green-600"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      {(() => {
                        const totalAmount = typeof selectedOrder.total === 'string' ? parseFloat(selectedOrder.total) : selectedOrder.total;
                        const paidAmount = amountToPay ? parseFloat(amountToPay) : totalAmount;
                        const balanceDue = Math.max(0, totalAmount - paidAmount);
                        return (
                          <>
                            <span className={`font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>Balance Due</span>
                            <span className={`text-sm font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ${balanceDue.toFixed(2)}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
