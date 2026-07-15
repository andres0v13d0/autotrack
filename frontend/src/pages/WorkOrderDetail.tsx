import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FileText, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import Field, { inputCls } from '../components/ui/Field';
import IntakeFormModal from '../components/IntakeFormModal';
import { workOrdersService } from '../services/workOrders.service';
import { paymentsService } from '../services/payments.service';
import { pdfService } from '../services/pdf.service';
import type { PaymentMethod } from '../types/workOrder';

const MOCK_VEHICLES: Record<string, { plate: string; model: string; customerId: string; customerName: string }> = {
  v1: { plate: 'ABC-1234', model: '2018 Toyota Camry', customerId: 'c1', customerName: 'John Doe' },
  v2: { plate: 'XYZ-5678', model: '2020 Ford F-150',   customerId: 'c1', customerName: 'John Doe' },
  v3: { plate: 'MNO-9012', model: '2015 Honda Civic',  customerId: 'c2', customerName: 'Jane Smith' },
};

interface ItemForm {
  name: string;
  price: string;
  qty: string;
}

interface PaymentForm {
  amount: string;
  method: PaymentMethod;
  date: string;
}

export default function WorkOrderDetail() {
  const { vehicleId = '', workOrderId = '' } = useParams<{ vehicleId: string; workOrderId: string }>();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const vehicle = MOCK_VEHICLES[vehicleId];
  const [pdfToast, setPdfToast] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  const { register: registerItem, handleSubmit: handleItemSubmit, reset: resetItem, formState: { errors: itemErrors } } = useForm<ItemForm>({
    defaultValues: { qty: '1' },
  });

  const { register: registerPayment, handleSubmit: handlePaymentSubmit, reset: resetPayment, formState: { errors: paymentErrors } } = useForm<PaymentForm>({
    defaultValues: { method: 'cash', date: new Date().toISOString().split('T')[0] },
  });

  const qKey = ['work-order', workOrderId];
  const balanceKey = ['order-balance', workOrderId];

  const { data: order, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => workOrdersService.getOne(workOrderId),
  });

  const { data: balance } = useQuery({
    queryKey: balanceKey,
    queryFn: () => paymentsService.getOrderBalance(workOrderId),
    enabled: !!order,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qKey });
    qc.invalidateQueries({ queryKey: balanceKey });
    qc.invalidateQueries({ queryKey: ['work-orders', vehicleId] });
  };

  const addItemMutation = useMutation({
    mutationFn: (values: ItemForm) =>
      workOrdersService.addItem(workOrderId, {
        name: values.name,
        price: parseFloat(values.price),
        qty: parseInt(values.qty, 10),
      }),
    onSuccess: () => { invalidate(); resetItem({ name: '', price: '', qty: '1' }); },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => workOrdersService.removeItem(workOrderId, itemId),
    onSuccess: invalidate,
  });

  const addPaymentMutation = useMutation({
    mutationFn: (values: PaymentForm) =>
      paymentsService.create(workOrderId, parseFloat(values.amount), values.method, values.date),
    onSuccess: () => { invalidate(); setShowPaymentForm(false); resetPayment(); },
  });

  const handlePdf = async () => {
    try {
      await pdfService.downloadWorkOrderPdf(workOrderId);
      setPdfToast(true);
      setTimeout(() => setPdfToast(false), 2500);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  if (isLoading || !order) {
    return (
      <Layout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: '#f97316', borderTopColor: 'transparent' }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link to="/customers" className="text-orange-500 hover:text-orange-700">Customers</Link>
        <span>/</span>
        {vehicle && (
          <>
            <Link to={`/customers/${vehicle.customerId}/vehicles`} className="text-orange-500 hover:text-orange-700">
              Vehicles
            </Link>
            <span>/</span>
          </>
        )}
        <Link to={`/vehicles/${vehicleId}/work-orders`} className="text-orange-500 hover:text-orange-700">
          Work Orders
        </Link>
        <span>/</span>
        <span className="text-gray-400 text-xs font-mono">{order.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {vehicle && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider"
                style={{ backgroundColor: '#0f1f3d', color: '#f97316' }}>
                {vehicle.plate}
              </span>
            )}
            <h1 className="text-xl font-bold" style={{ color: '#0f1f3d' }}>
              {vehicle?.model}
            </h1>
          </div>
          <p className="text-sm text-gray-500">{order.description_needed}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#0f1f3d' }}>
            {balance?.paymentStatus || 'pending'}
          </span>
          <button
            onClick={handlePdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors"
            style={{ borderColor: '#0f1f3d', color: '#0f1f3d' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0f1f3d'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#0f1f3d'; }}
          >
            📄 {t('workOrders.generatePdf')}
          </button>
          <button
            onClick={() => setShowIntakeForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#f97316' }}
          >
            <FileText size={16} />
            Intake Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — items table + add form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-sm" style={{ color: '#0f1f3d' }}>{t('workOrders.items')}</h2>
              <span className="text-xs text-gray-400">{order.items.length} {t('workOrders.itemsCount')}</span>
            </div>

            {order.items.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">{t('workOrders.noItems')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">{t('workOrders.description')}</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">{t('workOrders.price')}</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">{t('workOrders.qty')}</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">{t('workOrders.lineTotal')}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700">{item.name}</td>
                      <td className="px-5 py-3 text-right text-gray-600">${item.price.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{item.qty}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-800">
                        ${(item.price * item.qty).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => removeItemMutation.mutate(item.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                          disabled={removeItemMutation.isPending}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add item form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#0f1f3d' }}>{t('workOrders.addItem')}</h2>
            <form onSubmit={handleItemSubmit((v) => addItemMutation.mutate(v))}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
              <Field label={t('workOrders.description')} error={itemErrors.name?.message}>
                <input {...registerItem('name', { required: true })}
                  className={inputCls(!!itemErrors.name)} placeholder="Brake pads" />
              </Field>
              <Field label={t('workOrders.price')} error={itemErrors.price?.message}>
                <input {...registerItem('price', { required: true, min: 0.01 })} type="number" step="0.01" min="0.01"
                  className={inputCls(!!itemErrors.price)} placeholder="0.00" />
              </Field>
              <Field label={t('workOrders.qty')} error={itemErrors.qty?.message}>
                <div className="flex gap-2">
                  <input {...registerItem('qty', { required: true, min: 1 })} type="number" min="1"
                    className={inputCls(!!itemErrors.qty)} placeholder="1" />
                  <button type="submit" disabled={addItemMutation.isPending}
                    className="shrink-0 px-4 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#f97316' }}>
                    +
                  </button>
                </div>
              </Field>
            </form>
          </div>
        </div>

        {/* Right — summary + payments */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#0f1f3d' }}>{t('workOrders.summary')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t('workOrders.subtotal')}</span>
                <span>${typeof order?.subtotal === 'string' ? parseFloat(order.subtotal).toFixed(2) : (order?.subtotal ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('workOrders.tax')} ({(order?.tax_rate ? Number(order.tax_rate) * 100 : 0).toFixed(2)}%)</span>
                <span>${typeof order?.tax === 'string' ? parseFloat(order.tax).toFixed(2) : (order?.tax ?? 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-base"
                style={{ color: '#0f1f3d' }}>
                <span>{t('workOrders.total')}</span>
                <span>${typeof order?.total === 'string' ? parseFloat(order.total).toFixed(2) : (order?.total ?? 0).toFixed(2)}</span>
              </div>

              {balance && (
                <>
                  <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between text-gray-600">
                    <span>Amount Paid</span>
                    <span>${balance.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between font-bold text-base ${balance.balanceDue! > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span>Balance Due</span>
                    <span>${balance.balanceDue!.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm" style={{ color: '#0f1f3d' }}>Record Payment</h2>
              {!showPaymentForm && balance && balance.balanceDue > 0 && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="text-xs font-semibold px-3 py-1 rounded-lg text-white hover:opacity-90"
                  style={{ backgroundColor: '#f97316' }}>
                  + Add
                </button>
              )}
            </div>

            {showPaymentForm && (
              <form onSubmit={handlePaymentSubmit((v) => addPaymentMutation.mutate(v))} className="space-y-3">
                <Field label="Amount" error={paymentErrors.amount?.message}>
                  <input {...registerPayment('amount', { required: true, min: 0.01 })} type="number" step="0.01" min="0.01"
                    className={inputCls(!!paymentErrors.amount)} placeholder="0.00" />
                </Field>
                <Field label="Method" error={paymentErrors.method?.message}>
                  <select {...registerPayment('method', { required: true })} className={inputCls(!!paymentErrors.method)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Date" error={paymentErrors.date?.message}>
                  <input {...registerPayment('date', { required: true })} type="date"
                    className={inputCls(!!paymentErrors.date)} />
                </Field>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowPaymentForm(false)}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={addPaymentMutation.isPending}
                    className="px-3 py-2 text-xs rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#f97316' }}>
                    {addPaymentMutation.isPending ? '...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Intake Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} style={{ color: '#f97316' }} />
                <h2 className="font-semibold text-sm" style={{ color: '#0f1f3d' }}>Formulario de Recepción</h2>
              </div>
              <button
                onClick={() => setShowIntakeForm(true)}
                className="text-xs font-semibold px-3 py-1 rounded-lg text-white hover:opacity-90 inline-flex items-center gap-1"
                style={{ backgroundColor: '#f97316' }}>
                <Plus size={14} />
                Crear
              </button>
            </div>
            <p className="text-xs text-gray-500">Documento de recepción del vehículo con datos del cliente, condición del vehículo y firma digital.</p>
          </div>
        </div>
      </div>

      {/* Intake Form Modal */}
      {showIntakeForm && order && (
        <IntakeFormModal
          workOrder={order}
          onClose={() => setShowIntakeForm(false)}
        />
      )}

      {/* PDF toast */}
      {pdfToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          🔜 {t('workOrders.pdfComingSoon')}
        </div>
      )}
    </Layout>
  );
}
