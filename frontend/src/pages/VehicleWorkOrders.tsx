import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Field, { inputCls } from '../components/ui/Field';
import { workOrdersService } from '../services/workOrders.service';

// Mock vehicle lookup — shared with CustomerVehicles mock
const MOCK_VEHICLES: Record<string, { plate: string; model: string; customerId: string }> = {
  v1: { plate: 'ABC-1234', model: '2018 Toyota Camry', customerId: '1' },
  v2: { plate: 'XYZ-5678', model: '2020 Ford F-150',   customerId: '1' },
  v3: { plate: 'MNO-9012', model: '2015 Honda Civic',  customerId: '2' },
};

export default function VehicleWorkOrders() {
  const { vehicleId = '' } = useParams<{ vehicleId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const vehicle = MOCK_VEHICLES[vehicleId];
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ description: string }>();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['work-orders', vehicleId],
    queryFn: () => workOrdersService.getByVehicle(vehicleId),
  });

  const createMutation = useMutation({
    mutationFn: ({ description }: { description: string }) =>
      workOrdersService.create(vehicleId, description),
    onSuccess: (newOrder) => {
      qc.invalidateQueries({ queryKey: ['work-orders', vehicleId] });
      setShowModal(false);
      reset();
      navigate(`/vehicles/${vehicleId}/work-orders/${newOrder.id}`);
    },
  });

  const onSubmit = (values: { description: string }) => {
    createMutation.mutate(values);
  };

  return (
    <Layout>
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/customers" className="text-orange-500 hover:text-orange-700">{t('customers.title')}</Link>
        <span>/</span>
        {vehicle && (
          <Link to={`/customers/${vehicle.customerId}/vehicles`} className="text-orange-500 hover:text-orange-700">
            {t('vehicles.title')}
          </Link>
        )}
        <span>/</span>
        <span>{t('workOrders.title')}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>{t('workOrders.title')}</h1>
          {vehicle && (
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-semibold" style={{ color: '#f97316' }}>{vehicle.plate}</span>
              {' '}{vehicle.model}
            </p>
          )}
        </div>
        <button
          onClick={() => { reset(); setShowModal(true); }}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: '#f97316' }}
        >
          + {t('workOrders.new')}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#f97316', borderTopColor: 'transparent' }} />
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm">{t('workOrders.empty')}</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-sm font-semibold text-orange-500 hover:text-orange-700">
            + {t('workOrders.new')}
          </button>
        </div>
      )}

      {orders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0f1f3d' }}>
                <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('workOrders.date')}</th>
                <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('workOrders.description')}</th>
                <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('workOrders.total')}</th>
                <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('workOrders.paymentStatus')}</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {orders.map((wo, i) => (
                <tr key={wo.id} className="border-t border-gray-100 hover:bg-orange-50/40 transition-colors"
                  style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td className="px-5 py-3.5 text-gray-500">{new Date(wo.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate">{wo.descriptionNeeded}</td>
                  <td className="px-5 py-3.5 font-semibold" style={{ color: '#0f1f3d' }}>${wo.total.toFixed(2)}</td>
                  <td className="px-5 py-3.5"><Badge status={wo.paymentStatus} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={`/vehicles/${vehicleId}/work-orders/${wo.id}`}
                      className="text-xs font-semibold text-orange-500 hover:text-orange-700">
                      {t('common.view')} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={t('workOrders.new')} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t('workOrders.descriptionNeeded')} error={errors.description?.message}>
              <textarea
                {...register('description', { required: t('common.required') })}
                className={inputCls(!!errors.description) + ' resize-none h-24'}
                placeholder="e.g. rear brake replacement, engine noise..."
              />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={createMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#f97316' }}>
                {createMutation.isPending ? '...' : t('common.create')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
