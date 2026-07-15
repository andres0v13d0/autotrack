import api from './api';

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: string;
  pendingOrders: number;
  totalCustomers: number;
  ordersThisMonth: number;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

export interface DailyRevenueData {
  date: string;
  revenue: number;
  orders_count: number;
}

export interface WorkOrderStatusData {
  status: string;
  count: number;
}

export interface TopCustomer {
  name: string;
  orderCount: number;
  totalSpent: number;
}

export interface PaymentMethodData {
  method: string;
  amount: number;
}

export const reportsService = {
  getDashboardSummary: () =>
    api.get<DashboardSummary>('/reports/dashboard-summary').then((r) => r.data),

  getMonthlyRevenue: (year: number = new Date().getFullYear()) =>
    api.get<MonthlyRevenueData[]>('/reports/monthly-revenue', { params: { year } }).then((r) => r.data),

  getDailyRevenue: (month: string) =>
    api.get<DailyRevenueData[]>('/reports/daily-revenue', { params: { month } }).then((r) => r.data),

  getWorkOrdersStatus: () =>
    api.get<WorkOrderStatusData[]>('/reports/work-orders-status').then((r) => r.data),

  getTopCustomers: () =>
    api.get<TopCustomer[]>('/reports/top-customers').then((r) => r.data),

  getPaymentMethodsBreakdown: () =>
    api.get<PaymentMethodData[]>('/reports/payment-methods').then((r) => r.data),
};
