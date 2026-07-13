import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { customersService } from '../services/customers.service';

const roleBadgeColor: Record<string, string> = {
  admin: '#f97316',
  front_desk: '#3b82f6',
  technician: '#10b981',
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch customers
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersService.findAll(),
  });

  return (
    <Layout>
      {/* Welcome card */}
      <div
        className="rounded-2xl p-8 mb-6 text-white shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3260 100%)',
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base"
            style={{ backgroundColor: '#f97316' }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white/60 text-sm">{t('dashboard.title')}</p>
            <h1 className="text-xl font-bold">{t('dashboard.welcome', { name: user?.name })}</h1>
          </div>
        </div>
        <span
          className="inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            backgroundColor: roleBadgeColor[user?.role ?? 'front_desk'] + '33',
            color: roleBadgeColor[user?.role ?? 'front_desk'],
            border: `1px solid ${roleBadgeColor[user?.role ?? 'front_desk']}55`,
          }}
        >
          {t(`roles.${user?.role}`)}
        </span>
      </div>

      {/* Stats from API */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Customers</p>
          <p className="text-3xl font-bold" style={{ color: '#0f1f3d' }}>
            {loadingCustomers ? '...' : customers.length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Active Users</p>
          <p className="text-3xl font-bold" style={{ color: '#0f1f3d' }}>1</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Status</p>
          <p className="text-3xl font-bold" style={{ color: '#10b981' }}>✓</p>
        </div>
      </div>
    </Layout>
  );
}
