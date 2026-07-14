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
import type { WorkOrder } from '../types/workOrder';
import type { Vehicle } from '../types';
import { Plus, X, Circle, Clock, CheckCircle2, Check } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Field, { inputCls } from '../components/ui/Field';

const createOrderSchema = z.object({
  customer_phone: z.string().regex(/^\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/, 'Invalid US phone'),
  vehicle_id: z.string().min(1, 'Select a vehicle'),
  description_needed: z.string().min(3, 'Description required'),
});
type CreateOrderValues = z.infer<typeof createOrderSchema>;

interface ItemForm {
  type: 'part' | 'labor';
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
  const [showItemForm, setShowItemForm] = useState(false);
  const itemNameInputRef = useRef<HTMLInputElement>(null);

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

  const { register: registerItem, handleSubmit: handleItemSubmit, reset: resetItem, formState: { errors: itemErrors } } = useForm<ItemForm>({
    defaultValues: { type: 'part', qty: '1' },
  });

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
        type: values.type,
        name: values.name,
        price: parseFloat(values.price),
        qty: parseInt(values.qty, 10),
      }) : Promise.reject('No work order selected'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-order', selectedWorkOrderId] });
      resetItem({ type: 'part', name: '', price: '', qty: '1' });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      selectedWorkOrderId ? workOrdersService.removeItem(selectedWorkOrderId, itemId) : Promise.reject('No work order selected'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-order', selectedWorkOrderId] });
    },
  });

  const handleCustomerChange = async (phone: string) => {
    if (phone.length >= 10) {
      setLoadingVehicles(true);
      try {
        const allCustomers = await customersService.findAll();
        const customer = allCustomers.find(c => c.phone === phone);
        if (customer) {
          const customerVehicles = await vehiclesService.findByCustomer(customer.id);
          setVehicles(customerVehicles);
        }
      } finally {
        setLoadingVehicles(false);
      }
    }
  };

  const handleViewOrder = (workOrderId: string) => {
    setSelectedWorkOrderId(workOrderId);
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
        let icon;
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
          }}
          size="md"
        >
          <form onSubmit={handleCreateSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <Field label="Customer Phone" error={createErrors.customer_phone?.message}>
              <input
                {...registerCreate('customer_phone')}
                className={inputCls(!!createErrors.customer_phone)}
                placeholder="(305) 555-1234"
                onChange={(e) => {
                  handleCustomerChange(e.target.value);
                }}
              />
            </Field>

            <Field label={t('vehicles.plate')} error={createErrors.vehicle_id?.message}>
              <select
                {...registerCreate('vehicle_id')}
                className={inputCls(!!createErrors.vehicle_id)}
                disabled={loadingVehicles || vehicles.length === 0}
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} - {v.model}
                  </option>
                ))}
              </select>
            </Field>

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
            setShowItemForm(false);
            resetItem();
          }}
          size="xl"
        >
          <div className="space-y-6 max-h-[85vh] overflow-y-auto">

            {/* Vehicle Details & Delivery Status */}
            <div className="grid grid-cols-3 gap-6 pb-6 border-b-2 border-gray-200">
              <div className="col-span-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Vehicle Details</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Plate</p>
                      <p className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>{selectedOrder.vehicle?.plate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Model</p>
                      <p className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>{selectedOrder.vehicle?.model || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Customer</p>
                      <p className="text-sm font-semibold" style={{ color: '#0f1f3d' }}>{selectedOrder.vehicle?.customer?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Delivery Status</p>
                  <select 
                    value={modalDeliveryStatus} 
                    onChange={(e) => setModalDeliveryStatus(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg border-2 border-slate-200 bg-white hover:border-slate-300 transition-colors"
                  >
                    <option value="new"><span className="inline-block w-2 h-2 rounded-full bg-white border border-slate-900 mr-2"></span>New</option>
                    <option value="in_progress"><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2"></span>In Progress</option>
                    <option value="ready"><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Ready</option>
                    <option value="delivered"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Delivered</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items Section - Invoice Style */}
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ color: '#0f1f3d' }}>Items</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">{t('workOrders.type')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">{t('workOrders.itemName')}</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">{t('workOrders.price')}</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">{t('workOrders.qty')}</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">{t('workOrders.lineTotal')}</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Existing Items */}
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.type === 'part' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {t(`workOrders.itemType.${item.type}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-right text-xs font-medium text-gray-900">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-xs font-medium text-gray-900">{item.qty}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">${(item.price * item.qty).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeItemMutation.mutate(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors cursor-pointer font-medium"
                            disabled={removeItemMutation.isPending}
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Add Item Row */}
                    {!showItemForm && (
                      <tr className="bg-white hover:bg-gray-50 transition-colors">
                        <td colSpan={6} className="px-4 py-3 text-right">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowItemForm(true);
                              setTimeout(() => itemNameInputRef.current?.focus(), 0);
                            }}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          >
                            + Add Item
                          </a>
                        </td>
                      </tr>
                    )}

                    {/* Add Item Input Row */}
                    {showItemForm && (
                      <tr className="bg-blue-50 border-t-2 border-blue-200">
                        <form onSubmit={handleItemSubmit((v) => addItemMutation.mutate(v))} className="contents">
                          <td className="px-4 py-3">
                            <select {...registerItem('type')} className={`${inputCls(!!itemErrors.type)} text-xs w-full`}>
                              <option value="part">{t('workOrders.itemType.part')}</option>
                              <option value="labor">{t('workOrders.itemType.labor')}</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              ref={itemNameInputRef}
                              {...registerItem('name')} 
                              className={`${inputCls(!!itemErrors.name)} text-xs w-full`} 
                              placeholder="Item name" 
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input {...registerItem('price')} type="number" step="0.01" min="0.01" className={`${inputCls(!!itemErrors.price)} text-xs w-full text-right`} placeholder="0.00" />
                          </td>
                          <td className="px-4 py-3">
                            <input {...registerItem('qty')} type="number" min="1" className={`${inputCls(!!itemErrors.qty)} text-xs w-full text-center`} placeholder="1" />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-xs font-medium text-gray-400">$0.00</div>
                          </td>
                          <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                            <button 
                              type="button"
                              onClick={() => setShowItemForm(false)}
                              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                            <button type="submit" disabled={addItemMutation.isPending} className="text-blue-600 hover:text-blue-800 font-semibold text-xs cursor-pointer transition-colors">
                              {addItemMutation.isPending ? '...' : '+ Add'}
                            </button>
                          </td>
                        </form>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                      defaultValue={(Number(selectedOrder.tax_rate) * 100).toFixed(2)}
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
                    <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center text-xs">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="font-semibold text-green-600">${balance.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-bold ${balance.balanceDue! > 0 ? 'text-red-600' : 'text-green-600'}`}>Balance Due</span>
                      <span className={`text-sm font-bold ${balance.balanceDue! > 0 ? 'text-red-600' : 'text-green-600'}`}>${balance.balanceDue!.toFixed(2)}</span>
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
