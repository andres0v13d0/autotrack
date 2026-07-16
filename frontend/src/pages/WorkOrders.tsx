import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Table from '../components/ui/Table';
import WorkOrderFilters from '../components/WorkOrderFilters';
import IntakeFormModal from '../components/IntakeFormModal';
import CreateWorkOrderModal from '../components/CreateWorkOrderModal';
import type { TableColumn } from '../components/ui/Table';
import { workOrdersService } from '../services/workOrders.service';
import { paymentsService } from '../services/payments.service';
import { pdfService } from '../services/pdf.service';
import type { WorkOrder } from '../types/workOrder';
import { Plus, Circle, Clock, CheckCircle2, Check, FileText } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { inputCls } from '../components/ui/Field';

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
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<'new' | 'in_progress' | 'ready' | 'delivered' | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'pending' | 'partial' | 'paid' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalDeliveryStatus, setModalDeliveryStatus] = useState<'new' | 'in_progress' | 'ready' | 'delivered'>('new');
  const [editingItems, setEditingItems] = useState<Record<string, { price: string; qty: string }>>({});
  const [amountToPay, setAmountToPay] = useState<string>('');
  const [taxRate, setTaxRate] = useState<string>('0');
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

  const { register: registerItem, handleSubmit: handleItemSubmit, reset: resetItem, formState: { errors: itemErrors }, watch: watchItem } = useForm<ItemForm>({
    defaultValues: { qty: '1' },
  });

  const handleSaveAndDownloadPdf = async () => {
    if (!selectedWorkOrderId) {
      console.error('No work order selected');
      return;
    }

    try {
      // Guardar tax rate si cambió
      if (taxRate && taxRate !== '0') {
        console.log('Updating tax rate:', parseFloat(taxRate) / 100);
        await workOrdersService.update(selectedWorkOrderId, { tax_rate: parseFloat(taxRate) / 100 });
      }

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

  const handleViewOrder = (workOrderId: string) => {
    setSelectedWorkOrderId(workOrderId);
    setShowDetailModal(true);
  };

  // Load tax rate from selected order
  React.useEffect(() => {
    if (selectedOrder && showDetailModal) {
      const taxRateValue = selectedOrder.tax_rate ? selectedOrder.tax_rate * 100 : 0;
      setTaxRate(String(taxRateValue.toFixed(2)));
      setAmountToPay('');
    }
  }, [selectedOrder, showDetailModal]);

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

      <CreateWorkOrderModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

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
                onClick={() => setShowIntakeForm(true)}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 cursor-pointer transition-opacity inline-flex items-center gap-2"
                style={{ backgroundColor: '#10b981' }}
              >
                <FileText size={16} />
                Intake Form
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
          <div className="space-y-6">

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
              <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                <div className="min-w-full" style={{ minWidth: '600px' }}>
                  <table className="w-full text-sm md:text-sm text-xs">
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th className="px-6 py-4 text-left text-xs md:text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">{t('workOrders.description')}</th>
                        <th className="px-6 py-4 text-right text-xs md:text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">{t('workOrders.price')}</th>
                        <th className="px-6 py-4 text-center text-xs md:text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">{t('workOrders.qty')}</th>
                        <th className="px-6 py-4 text-right text-xs md:text-xs font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">{t('workOrders.lineTotal')}</th>
                        <th className="px-6 py-4"></th>
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
                            <td className="px-6 py-4">
                              <input 
                                type="text"
                                defaultValue={item.name}
                                className="text-sm md:text-xs w-40 md:w-full px-3 py-2 md:py-1 border border-gray-300 rounded whitespace-nowrap"
                                readOnly
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number"
                                step="0.01"
                                value={edited?.price ?? (typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2))}
                                onChange={(e) => setEditingItems({ ...editingItems, [item.id]: { ...edited, price: e.target.value } })}
                                className="text-sm md:text-xs w-32 md:w-24 px-3 py-2 md:py-1 border border-gray-300 rounded text-right ml-auto block"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="number"
                                min="1"
                                value={edited?.qty ?? item.qty}
                                onChange={(e) => setEditingItems({ ...editingItems, [item.id]: { ...edited, qty: e.target.value } })}
                                className="text-sm md:text-xs w-20 md:w-16 px-3 py-2 md:py-1 border border-gray-300 rounded text-center ml-auto block"
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm md:text-xs font-bold text-gray-900 whitespace-nowrap">
                                ${lineTotal}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
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
                            <td className="px-6 py-4">
                              <input 
                                {...registerItem('name')} 
                                className={`${inputCls(!!itemErrors.name)} text-sm md:text-xs w-40 md:w-full py-2 md:py-1 px-3`} 
                                placeholder="Description" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                {...registerItem('price')} 
                                type="number" 
                                step="0.01" 
                                min="0.01" 
                                className={`${inputCls(!!itemErrors.price)} text-sm md:text-xs w-32 md:w-24 py-2 md:py-1 px-3 text-right ml-auto block`} 
                                placeholder="0.00" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                {...registerItem('qty')} 
                                type="number" 
                                min="1" 
                                className={`${inputCls(!!itemErrors.qty)} text-sm md:text-xs w-20 md:w-16 py-2 md:py-1 px-3 text-center ml-auto block`} 
                                placeholder="1" 
                              />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm md:text-xs font-medium text-gray-900 whitespace-nowrap">
                                ${newLineTotal}
                              </div>
                            </td>
                            <td className="px-6 py-4"></td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
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
                      onBlur={async () => {
                        const taxValue = taxRate && taxRate !== '0' ? parseFloat(taxRate) / 100 : 0;
                        try {
                          await workOrdersService.update(selectedWorkOrderId!, { tax_rate: taxValue });
                          qc.invalidateQueries({ queryKey: ['work-order', selectedWorkOrderId] });
                        } catch (e) {
                          console.error('Error updating tax rate:', e);
                        }
                      }}
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${(() => {
                      const taxRateNum = (taxRate && taxRate !== '' && taxRate !== '0') ? parseFloat(taxRate) : 0;
                      const subtotal = typeof selectedOrder.subtotal === 'string' ? parseFloat(selectedOrder.subtotal) : selectedOrder.subtotal;
                      const taxAmount = taxRateNum > 0 ? (subtotal * taxRateNum) / 100 : 0;
                      return isNaN(taxAmount) ? '0.00' : taxAmount.toFixed(2);
                    })()}
                  </span>
                </div>
                <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center font-bold">
                  <span style={{ color: '#0f1f3d' }}>Total Due</span>
                  <span style={{ color: '#f97316' }} className="text-lg">
                    ${(() => {
                      const taxRateNum = (taxRate && taxRate !== '' && taxRate !== '0') ? parseFloat(taxRate) : 0;
                      const subtotal = typeof selectedOrder.subtotal === 'string' ? parseFloat(selectedOrder.subtotal) : selectedOrder.subtotal;
                      const taxAmount = taxRateNum > 0 ? (subtotal * taxRateNum) / 100 : 0;
                      const total = subtotal + taxAmount;
                      return isNaN(total) ? '0.00' : total.toFixed(2);
                    })()}
                  </span>
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

      {/* Intake Form Modal */}
      {showIntakeForm && selectedOrder && (
        <IntakeFormModal
          workOrder={selectedOrder}
          onClose={() => setShowIntakeForm(false)}
        />
      )}
    </Layout>
  );
}
