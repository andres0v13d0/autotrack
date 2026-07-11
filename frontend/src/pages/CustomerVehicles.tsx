import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../components/Layout';
import type { Vehicle } from '../types';

const schema = z.object({
  plate: z.string().min(2),
  model: z.string().min(2),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const MOCK_VEHICLES: Record<string, Vehicle[]> = {
  '1': [
    { id: 'v1', customer_id: '1', plate: 'ABC-1234', model: '2018 Toyota Camry', description: 'Rear brake replacement', created_at: '2025-03-01T00:00:00Z' },
    { id: 'v2', customer_id: '1', plate: 'XYZ-5678', model: '2020 Ford F-150',   description: 'Oil change',            created_at: '2025-04-10T00:00:00Z' },
  ],
  '2': [
    { id: 'v3', customer_id: '2', plate: 'MNO-9012', model: '2015 Honda Civic',  description: 'AC not working',        created_at: '2025-02-22T00:00:00Z' },
  ],
  '3': [],
};

const MOCK_CUSTOMERS: Record<string, string> = {
  '1': 'Robert Miller', '2': 'Diana Fuentes', '3': 'James Thompson',
};

export default function CustomerVehicles() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const customerId = id ?? '';
  const customerName = MOCK_CUSTOMERS[customerId] ?? 'Customer';

  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES[customerId] ?? []);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ plate: '', model: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    reset({ plate: v.plate, model: v.model, description: v.description ?? '' });
    setShowModal(true);
  };

  const onSubmit = (values: FormValues) => {
    if (editing) {
      setVehicles((prev) => prev.map((v) => v.id === editing.id ? { ...v, ...values } : v));
    } else {
      const newV: Vehicle = {
        id: `v-${Date.now()}`,
        customer_id: customerId,
        ...values,
        created_at: new Date().toISOString(),
      };
      setVehicles((prev) => [...prev, newV]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (deleteId) setVehicles((prev) => prev.filter((v) => v.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <Layout>
      <div className="mb-4">
        <Link to="/customers" className="text-sm text-orange-500 hover:text-orange-700">
          ← {t('customers.title')}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>{t('vehicles.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customerName}</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: '#f97316' }}
        >
          + {t('vehicles.new')}
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm">{t('vehicles.empty')}</p>
          <button onClick={openCreate} className="mt-4 text-sm font-semibold text-orange-500 hover:text-orange-700">
            + {t('vehicles.new')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              {/* Plate + actions */}
              <div className="flex items-start justify-between">
                <div
                  className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider"
                  style={{ backgroundColor: '#0f1f3d', color: '#f97316' }}
                >
                  {v.plate}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(v)} className="text-xs text-gray-400 hover:text-gray-700">
                    {t('common.edit')}
                  </button>
                  <button onClick={() => setDeleteId(v.id)} className="text-xs text-red-400 hover:text-red-600">
                    {t('common.delete')}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div>
                <p className="font-semibold text-gray-800 text-sm">{v.model}</p>
                {v.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{v.description}</p>
                )}
                <p className="text-gray-300 text-xs mt-2">{new Date(v.created_at).toLocaleDateString()}</p>
              </div>

              {/* Work Orders button */}
              <Link
                to={`/vehicles/${v.id}/work-orders`}
                className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border-2 transition-colors"
                style={{ borderColor: '#0f1f3d', color: '#0f1f3d' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#0f1f3d';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#0f1f3d';
                }}
              >
                🔧 {t('workOrders.viewOrders')}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <Modal title={editing ? t('vehicles.edit') : t('vehicles.new')} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t('vehicles.plate')} error={errors.plate?.message}>
              <input {...register('plate')} className={inputCls(!!errors.plate)} placeholder="ABC-1234" />
            </Field>
            <Field label={t('vehicles.model')} error={errors.model?.message}>
              <input {...register('model')} className={inputCls(!!errors.model)} placeholder="2018 Toyota Camry" />
            </Field>
            <Field label={t('vehicles.description')} error={errors.description?.message}>
              <textarea
                {...register('description')}
                className={inputCls(false) + ' resize-none h-20'}
                placeholder="e.g. rear brake replacement"
              />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button type="submit"
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90"
                style={{ backgroundColor: '#f97316' }}>
                {t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Modal title={t('common.confirmDelete')} onClose={() => setDeleteId(null)}>
          <p className="text-gray-600 text-sm mb-5">{t('common.deleteWarning')}</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
              {t('common.cancel')}
            </button>
            <button onClick={confirmDelete}
              className="px-4 py-2 text-sm rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600">
              {t('common.delete')}
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

/* ── helpers ── */
function inputCls(hasError: boolean) {
  return `w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
    hasError ? 'border-red-400' : 'border-gray-300'
  }`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-gray-700">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: '#0f1f3d' }}>{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
