import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import Badge from '../components/ui/Badge';
import Field, { inputCls } from '../components/ui/Field';
import { workOrdersService } from '../services/workOrders.service';
import { TAX_RATE_LABEL } from '../config/constants';
import type { PaymentStatus, WorkOrderItemType } from '../types/workOrder';

const MOCK_VEHICLES: Record<string, { plate: string; model: string; customerId: string }> = {
  v1: { plate: 'ABC-1234', model: '2018 Toyota Camry', customerId: '1' },
  v2: { plate: 'XYZ-5678', model: '2020 Ford F-150',   customerId: '1' },
  v3: { plate: 'MNO-9012', model: '2015 Honda Civic',  customerId: '2' },
};

interface ItemForm {
  type: WorkOrderItemType;
  name: string;
  price: string;
  qty: string;
}

export default function WorkOrderDetail() {
  const { vehicleId = '', workOrderId = '' } = useParams<{ vehicleId: string; workOrderId: string }>();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const vehicle = MOCK_VEHICLES[vehicleId];
  const [pdfToast, setPdfToast] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemForm>({
    defaultValues: { type: 'part', qty: '1' },
  });

  const qKey = ['work-order', workOrderId];

  const { data: order, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => workOrdersService.getOne(workOrderId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qKey });
    qc.invalidateQueries({ queryKey: ['work-orders', vehicleId] });
  };

  const addItemMutation = useMutation({
    mutationFn: (values: ItemForm) =>
      workOrdersService.addItem(workOrderId, {
        type: values.type,
        name: values.name,
        price: parseFloat(values.price),
        qty: parseInt(values.qty, 10),
      }),
    onSuccess: () => { invalidate(); reset({ type: 'part', name: '', price: '', qty: '1' }); },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => workOrdersService.removeItem(workOrderId, itemId),
    onSuccess: invalidate,
  });

  const paymentMutation = useMutation({
    mutationFn: (status: PaymentStatus) => workOrdersService.updatePaymentStatus(workOrderId, status),
    onSuccess: invalidate,
  });

  const handlePdf = () => {
    console.log('Generate PDF — coming soon');
    setPdfToast(true);
    setTimeout(() => setPdfToast(false), 2500);
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
        <Link to="/customers" className="text-orange-500 hover:text-orange-700">{t('customers.title')}</Link>
        <span>/</span>
        {vehicle && (
          <>
            <Link to={`/customers/${vehicle.customerId}/vehicles`} className="text-orange-500 hover:text-orange-700">
              {t('vehicles.title')}
            </Link>
            <span>/</span>
          </>
        )}
        <Link to={`/vehicles/${vehicleId}/work-orders`} className="text-orange-500 hover:text-orange-700">
          {t('workOrders.title')}
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
          <p className="text-sm text-gray-500">{order.descriptionNeeded}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={order.paymentStatus} className="text-sm px-3 py-1" />
          <button
            onClick={handlePdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors"
            style={{ borderColor: '#0f1f3d', color: '#0f1f3d' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0f1f3d'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#0f1f3d'; }}
          >
            📄 {t('workOrders.generatePdf')}
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
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">{t('workOrders.type')}</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">{t('workOrders.itemName')}</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">{t('workOrders.price')}</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">{t('workOrders.qty')}</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">{t('workOrders.lineTotal')}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.type === 'part'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {t(`workOrders.itemType.${item.type}`)}
                        </span>
                      </td>
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
            <form onSubmit={handleSubmit((v) => addItemMutation.mutate(v))}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <Field label={t('workOrders.type')} error={errors.type?.message}>
                <select {...register('type', { required: true })} className={inputCls(!!errors.type)}>
                  <option value="part">{t('workOrders.itemType.part')}</option>
                  <option value="labor">{t('workOrders.itemType.labor')}</option>
                </select>
              </Field>
              <Field label={t('workOrders.itemName')} error={errors.name?.message}>
                <input {...register('name', { required: true })}
                  className={inputCls(!!errors.name)} placeholder="Brake pads" />
              </Field>
              <Field label={t('workOrders.price')} error={errors.price?.message}>
                <input {...register('price', { required: true, min: 0.01 })} type="number" step="0.01" min="0.01"
                  className={inputCls(!!errors.price)} placeholder="0.00" />
              </Field>
              <Field label={t('workOrders.qty')} error={errors.qty?.message}>
                <div className="flex gap-2">
                  <input {...register('qty', { required: true, min: 1 })} type="number" min="1"
                    className={inputCls(!!errors.qty)} placeholder="1" />
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

        {/* Right — summary card */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#0f1f3d' }}>{t('workOrders.summary')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t('workOrders.subtotal')}</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('workOrders.tax')} ({TAX_RATE_LABEL})</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-base"
                style={{ color: '#0f1f3d' }}>
                <span>{t('workOrders.total')}</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment status selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-sm mb-3" style={{ color: '#0f1f3d' }}>{t('workOrders.paymentStatus')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['paid', 'partial', 'pending', 'credit'] as PaymentStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => paymentMutation.mutate(s)}
                  disabled={paymentMutation.isPending}
                  className="py-2 rounded-lg text-xs font-semibold border-2 transition-all"
                  style={
                    order.paymentStatus === s
                      ? { backgroundColor: '#0f1f3d', borderColor: '#0f1f3d', color: '#fff' }
                      : { backgroundColor: 'transparent', borderColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  {t(`workOrders.status.${s}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PDF toast */}
      {pdfToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          🔜 {t('workOrders.pdfComingSoon')}
        </div>
      )}
    </Layout>
  );
}
