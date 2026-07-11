import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import type { Customer } from '../types';

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/, 'Invalid US phone'),
});
type FormValues = z.infer<typeof schema>;

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Robert Miller',   phone: '(305) 555-1001', created_at: '2025-01-15T00:00:00Z', vehicles: [] },
  { id: '2', name: 'Diana Fuentes',   phone: '(786) 555-2002', created_at: '2025-02-20T00:00:00Z', vehicles: [] },
  { id: '3', name: 'James Thompson',  phone: '(954) 555-3003', created_at: '2025-03-10T00:00:00Z', vehicles: [] },
];

export default function Customers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => { setEditing(null); reset({ name: '', phone: '' }); setShowModal(true); };
  const openEdit = (c: Customer) => { setEditing(c); reset({ name: c.name, phone: c.phone }); setShowModal(true); };

  const onSubmit = (values: FormValues) => {
    if (editing) {
      setCustomers((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...values } : c));
    } else {
      const newC: Customer = { id: Date.now().toString(), ...values, created_at: new Date().toISOString(), vehicles: [] };
      setCustomers((prev) => [...prev, newC]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (deleteId) setCustomers((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0f1f3d' }}>{t('customers.title')}</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#f97316' }}
        >
          + {t('customers.new')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#0f1f3d' }}>
              <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('customers.name')}</th>
              <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('customers.phone')}</th>
              <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('customers.createdAt')}</th>
              <th className="text-left px-5 py-3.5 font-medium text-white/80">{t('customers.vehicles')}</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-orange-50/40 transition-colors"
                style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                <td className="px-5 py-3.5 font-medium text-gray-800">{c.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{c.phone}</td>
                <td className="px-5 py-3.5 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3.5">
                  <Link
                    to={`/customers/${c.id}/vehicles`}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
                    style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}
                  >
                    {(c.vehicles?.length ?? 0)} {t('customers.vehicles')}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => openEdit(c)} className="text-xs text-gray-500 hover:text-gray-800 mr-3">
                    {t('common.edit')}
                  </button>
                  <button onClick={() => setDeleteId(c.id)} className="text-xs text-red-500 hover:text-red-700">
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <Modal title={editing ? t('customers.edit') : t('customers.new')} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t('customers.name')} error={errors.name?.message}>
              <input {...register('name')} className={inputCls(!!errors.name)} placeholder="John Doe" />
            </Field>
            <Field label={t('customers.phone')} error={errors.phone?.message}>
              <input {...register('phone')} className={inputCls(!!errors.phone)} placeholder="(305) 555-1234" />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button type="submit" className="px-4 py-2 text-sm rounded-lg text-white font-semibold hover:opacity-90"
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
            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
              {t('common.cancel')}
            </button>
            <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600">
              {t('common.delete')}
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

/* ── shared helpers ── */
function inputCls(hasError: boolean) {
  return `w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${hasError ? 'border-red-400' : 'border-gray-300'}`;
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
