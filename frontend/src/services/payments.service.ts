import axios from 'axios';

export type PaymentMethod = 'cash' | 'card' | 'check' | 'other';

export interface Payment {
  id: string;
  work_order_id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  created_at: string;
}

export interface OrderBalance {
  workOrderId: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
}

export interface CustomerDebt {
  customerId: string;
  totalDebt: number;
  totalPaid: number;
  workOrdersWithDebt: OrderBalance[];
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const paymentsService = {
  create: (workOrderId: string, amount: number, method: PaymentMethod, date: string): Promise<Payment> =>
    api
      .post('/payments', {
        work_order_id: workOrderId,
        amount,
        method,
        date,
      })
      .then((res) => res.data),

  getByWorkOrder: (workOrderId: string): Promise<Payment[]> =>
    api.get(`/payments/work-order/${workOrderId}`).then((res) => res.data),

  getOrderBalance: (workOrderId: string): Promise<OrderBalance> =>
    api.get(`/payments/work-order/${workOrderId}/balance`).then((res) => res.data),

  delete: (paymentId: string): Promise<void> =>
    api.delete(`/payments/${paymentId}`).then(() => undefined),
};

export const customersBalanceService = {
  getCustomerDebt: (customerId: string): Promise<CustomerDebt> =>
    api.get(`/customers/${customerId}/balance`).then((res) => res.data),
};
