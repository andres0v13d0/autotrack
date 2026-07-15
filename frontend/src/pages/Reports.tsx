import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { reportsService } from '../services/reports.service';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Fetch dashboard summary
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => reportsService.getDashboardSummary(),
  });

  // Fetch daily revenue
  const { data: dailyReports, isLoading: loadingDaily } = useQuery({
    queryKey: ['daily-revenue', selectedMonth],
    queryFn: () => reportsService.getDailyRevenue(selectedMonth),
  });

  // Fetch monthly revenue
  const { data: monthlyRevenue, isLoading: loadingMonthly } = useQuery({
    queryKey: ['monthly-revenue'],
    queryFn: () => reportsService.getMonthlyRevenue(),
  });

  // Fetch work orders status
  const { data: workOrdersStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['work-orders-status'],
    queryFn: () => reportsService.getWorkOrdersStatus(),
  });

  // Fetch payment methods
  const { data: paymentMethods, isLoading: loadingPayments } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => reportsService.getPaymentMethodsBreakdown(),
  });

  const isLoading = loadingSummary || loadingDaily || loadingMonthly || loadingStatus || loadingPayments;

  // Chart configurations
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
        pointRadius: 5,
      },
    ],
  };

  const dailyRevenueChart = {
    labels: dailyReports?.map((d) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [
      {
        label: 'Daily Revenue ($)',
        data: dailyReports?.map((d) => d.revenue) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 1,
      },
    ],
  };

  const workOrdersStatusChart = {
    labels: workOrdersStatus?.map((d) => d.status) || [],
    datasets: [
      {
        label: 'Work Orders Count',
        data: workOrdersStatus?.map((d) => d.count) || [],
        backgroundColor: ['#e5e7eb', '#f97316', '#3b82f6', '#10b981'],
        borderColor: ['#d1d5db', '#d97706', '#1d4ed8', '#059669'],
        borderWidth: 2,
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
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#0f1f3d' }}>
            Reports & Analytics
          </h1>
          <p className="text-gray-600">Comprehensive financial reports and business statistics</p>
        </div>

        {/* Key Metrics */}
        {!isLoading && summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <p className="text-sm text-blue-700 font-medium mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-900">${summary.totalRevenue}</p>
              <p className="text-xs text-blue-600 mt-2">All time</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <p className="text-sm text-green-700 font-medium mb-2">Total Orders</p>
              <p className="text-3xl font-bold text-green-900">{summary.totalOrders}</p>
              <p className="text-xs text-green-600 mt-2">{summary.ordersThisMonth} this month</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <p className="text-sm text-purple-700 font-medium mb-2">Total Customers</p>
              <p className="text-3xl font-bold text-purple-900">{summary.totalCustomers}</p>
              <p className="text-xs text-purple-600 mt-2">Active</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <p className="text-sm text-orange-700 font-medium mb-2">Pending Orders</p>
              <p className="text-3xl font-bold text-orange-900">{summary.pendingOrders}</p>
              <p className="text-xs text-orange-600 mt-2">Awaiting work</p>
            </div>
          </div>
        )}

        {/* Month Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <Calendar size={20} className="text-gray-600" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
            />
            <span className="text-sm text-gray-600">Select month to view daily breakdown</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {loadingMonthly && <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>}
          </div>

          {/* Work Orders Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f1f3d' }}>
              Work Orders Status
            </h2>
            {!loadingStatus && workOrdersStatus && (
              <div className="h-80 flex items-center justify-center">
                <Pie data={workOrdersStatusChart} options={chartOptions} />
              </div>
            )}
            {loadingStatus && <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>}
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f1f3d' }}>
              Daily Revenue - {selectedMonth}
            </h2>
            {!loadingDaily && dailyReports && dailyReports.length > 0 && (
              <div className="h-80">
                <Bar data={dailyRevenueChart} options={{ ...chartOptions, maintainAspectRatio: false }} />
              </div>
            )}
            {!loadingDaily && (!dailyReports || dailyReports.length === 0) && (
              <div className="h-80 flex items-center justify-center text-gray-500">No data for selected month</div>
            )}
            {loadingDaily && <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>}
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f1f3d' }}>
              Payment Methods Distribution
            </h2>
            {!loadingPayments && paymentMethods && (
              <div className="h-80 flex items-center justify-center">
                <Pie data={paymentMethodsChart} options={chartOptions} />
              </div>
            )}
            {loadingPayments && <div className="h-80 flex items-center justify-center text-gray-500">Loading...</div>}
          </div>
        </div>

        {/* Daily Breakdown Table */}
        {!loadingDaily && dailyReports && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold" style={{ color: '#0f1f3d' }}>
                Daily Breakdown - {selectedMonth}
              </h2>
            </div>

            {dailyReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Orders</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReports.map((day, idx) => (
                      <tr
                        key={idx}
                        className={`border-t border-gray-100 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{day.orders_count}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">
                          ${day.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">No data for selected month</div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <p className="text-sm text-blue-900">
            <strong>ℹ️ Note:</strong> All reports are based on payment dates and actual transaction data.
            Revenue is calculated from confirmed payments. Use the month selector to view specific periods.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Reports;
