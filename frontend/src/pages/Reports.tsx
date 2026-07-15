import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { useState } from 'react';

interface MonthlyReport {
  month: string;
  total_revenue: number;
  total_paid: number;
  orders_count: number;
}

interface DailyReport {
  date: string;
  revenue: number;
  orders_count: number;
}

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Placeholder data - Replace with actual API call
  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ['reports-monthly'],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return {
        month: selectedMonth,
        total_revenue: 15240.50,
        total_paid: 12000.00,
        orders_count: 24,
      } as MonthlyReport;
    },
  });

  const { data: dailyReports, isLoading: dailyLoading } = useQuery({
    queryKey: ['reports-daily', selectedMonth],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      return [
        { date: '2025-01-15', revenue: 1200.50, orders_count: 3 },
        { date: '2025-01-16', revenue: 1850.75, orders_count: 5 },
        { date: '2025-01-17', revenue: 950.25, orders_count: 2 },
      ] as DailyReport[];
    },
  });

  const isLoading = monthlyLoading || dailyLoading;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#0f1f3d' }}>
            Reports
          </h1>
          <p className="text-gray-600">View your shop's financial reports and statistics</p>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <Calendar size={20} className="text-gray-600" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Monthly Summary */}
        {!isLoading && monthlyReport && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-sm border border-green-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${monthlyReport.total_revenue.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <TrendingUp size={20} className="text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm border border-blue-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total Collected</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${monthlyReport.total_paid.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <BarChart3 size={20} className="text-blue-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm border border-purple-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-1">Orders</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {monthlyReport.orders_count}
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <BarChart3 size={20} className="text-purple-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold" style={{ color: '#0f1f3d' }}>
              Daily Breakdown
            </h2>
          </div>

          {!isLoading && dailyReports && (
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
          )}

          {isLoading && (
            <div className="p-12 text-center text-gray-500">Loading report data...</div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
          <p className="text-sm text-blue-900">
            <strong>ℹ️ Note:</strong> Reports show revenue based on work order creation date. 
            Data refreshes automatically. Use the month selector above to view different periods.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Reports;
