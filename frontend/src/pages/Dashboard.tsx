import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { reportsService } from '../services/reports.service';
import { TrendingUp, Users, Wrench, DollarSign, BarChart3 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const roleBadgeColor: Record<string, string> = {
  admin: '#f97316',
  front_desk: '#3b82f6',
  technician: '#10b981',
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch dashboard summary
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => reportsService.getDashboardSummary(),
  });

  // Fetch work orders status
  const { data: workOrdersStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['work-orders-status'],
    queryFn: () => reportsService.getWorkOrdersStatus(),
  });

  // Fetch monthly revenue
  const { data: monthlyRevenue, isLoading: loadingMonthly } = useQuery({
    queryKey: ['monthly-revenue'],
    queryFn: () => reportsService.getMonthlyRevenue(),
  });

  // Fetch top customers
  const { data: topCustomers, isLoading: loadingCustomers } = useQuery({
    queryKey: ['top-customers'],
    queryFn: () => reportsService.getTopCustomers(),
  });

  // Fetch payment methods
  const { data: paymentMethods, isLoading: loadingPayments } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => reportsService.getPaymentMethodsBreakdown(),
  });

  const isLoading = loadingSummary || loadingStatus || loadingMonthly || loadingCustomers || loadingPayments;

  // Chart data
  const workOrdersStatusChart = {
    labels: workOrdersStatus?.map((d) => d.status) || [],
    datasets: [
      {
        label: 'Work Orders',
        data: workOrdersStatus?.map((d) => d.count) || [],
        backgroundColor: ['#e5e7eb', '#f97316', '#3b82f6', '#10b981'],
        borderColor: ['#d1d5db', '#d97706', '#1d4ed8', '#059669'],
        borderWidth: 2,
      },
    ],
  };

  const monthlyRevenueChart = {
    labels: monthlyRevenue?.map((d) => d.month) || [],
    datasets: [
      {
        label: 'Monthly Revenue ($)',
        data: monthlyRevenue?.map((d) => d.revenue) || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#059669',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const paymentMethodsChart = {
    labels: paymentMethods?.map((d) => d.method) || [],
    datasets: [
      {
        label: 'Payment Methods ($)',
        data: paymentMethods?.map((d) => d.amount) || [],
        backgroundColor: ['#fbbf24', '#3b82f6', '#8b5cf6', '#ef4444'],
        borderColor: ['#f59e0b', '#1d4ed8', '#7c3aed', '#dc2626'],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#6b7280',
          font: { size: 12, weight: 'normal' as const },
        },
      },
    },
  } as any;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome card */}
        <div
          className="rounded-2xl p-8 text-white shadow-lg"
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

        {/* Key Metrics */}
        {!isLoading && summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-blue-900">{summary.totalOrders}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <Wrench size={20} className="text-blue-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-green-900">${summary.totalRevenue}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <DollarSign size={20} className="text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-900">{summary.pendingOrders}</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-lg">
                  <TrendingUp size={20} className="text-orange-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-1">Customers</p>
                  <p className="text-3xl font-bold text-purple-900">{summary.totalCustomers}</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <Users size={20} className="text-purple-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium mb-1">This Month</p>
                  <p className="text-3xl font-bold text-red-900">{summary.ordersThisMonth}</p>
                </div>
                <div className="p-3 bg-red-200 rounded-lg">
                  <BarChart3 size={20} className="text-red-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Orders Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f1f3d' }}>
              Work Orders Status
            </h2>
            {!loadingStatus && workOrdersStatus && (
              <div className="h-64 flex items-center justify-center">
                <Pie data={workOrdersStatusChart} options={chartOptions} />
              </div>
            )}
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f1f3d' }}>
              Payment Methods
            </h2>
            {!loadingPayments && paymentMethods && (
              <div className="h-64 flex items-center justify-center">
                <Pie data={paymentMethodsChart} options={chartOptions} />
              </div>
            )}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f1f3d' }}>
            Monthly Revenue Trend
          </h2>
          {!loadingMonthly && monthlyRevenue && (
            <div className="h-80">
              <Line data={monthlyRevenueChart} options={{ ...chartOptions, maintainAspectRatio: false }} />
            </div>
          )}
        </div>

        {/* Top Customers */}
        {!loadingCustomers && topCustomers && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f1f3d' }}>
              Top Customers
            </h2>
            <div className="space-y-3">
              {topCustomers.map((customer, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.orderCount} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${customer.totalSpent.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
