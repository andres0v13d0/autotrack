import api from './api';
import type { Customer } from '../types';

export const customersService = {
  findAll: () => api.get<Customer[]>('/customers').then((r) => r.data),
  findOne: (id: string) => api.get<Customer>(`/customers/${id}`).then((r) => r.data),
  findByPhone: (phone: string) =>
    api.get<Customer>('/customers/search', { params: { phone } }).then((r) => r.data),
  create: (data: { name: string; phone: string }) =>
    api.post<Customer>('/customers', data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; phone: string }>) =>
    api.patch<Customer>(`/customers/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/customers/${id}`).then((r) => r.data),
};
