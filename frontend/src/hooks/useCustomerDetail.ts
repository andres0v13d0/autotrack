import { useState } from 'react';
import axios from 'axios';
import type { Customer, Vehicle } from '../types';
import { vehiclesService } from '../services/vehicles.service';
import { paymentsService } from '../services/payments.service';

interface CustomerBalance {
  total: number;
  paid: number;
  debt: number;
}

export const useCustomerDetail = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerWorkOrders, setCustomerWorkOrders] = useState<any[]>([]);
  const [customerBalance, setCustomerBalance] = useState<CustomerBalance>({
    total: 0,
    paid: 0,
    debt: 0,
  });
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadCustomerDetail = async (customer: Customer) => {
    setLoadingDetail(true);
    try {
      const vdata = await vehiclesService.findByCustomer(customer.id);
      setVehicles(vdata);

      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      });
      api.interceptors.request.use((config) => {
        const token = localStorage.getItem('access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      });

      const allWorkOrders = await api.get('/work-orders').then(res => res.data);
      const filtered = allWorkOrders.filter((wo: any) => wo.vehicle?.customer_id === customer.id);
      setCustomerWorkOrders(filtered);

      let totalAmount = 0, totalPaid = 0;
      for (const wo of filtered) {
        const subtotal = Number(wo.subtotal);
        const taxRate = Number(wo.tax_rate);
        totalAmount += subtotal + (subtotal * taxRate);
        try {
          const payments = await paymentsService.getByWorkOrder(wo.id);
          totalPaid += payments.reduce((sum: number, p: any) => sum + p.amount, 0);
        } catch (e) {
          // Continue if payment fetch fails
        }
      }
      setCustomerBalance({
        total: totalAmount,
        paid: totalPaid,
        debt: totalAmount - totalPaid,
      });
    } catch (e) {
      setVehicles([]);
      setCustomerWorkOrders([]);
      setCustomerBalance({ total: 0, paid: 0, debt: 0 });
    } finally {
      setLoadingDetail(false);
    }
  };

  return {
    vehicles,
    customerWorkOrders,
    customerBalance,
    loadingDetail,
    loadCustomerDetail,
  };
};
