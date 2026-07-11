import api from './api';
import type { Vehicle } from '../types';

export const vehiclesService = {
  findAll: () => api.get<Vehicle[]>('/vehicles').then((r) => r.data),
  findByCustomer: (customer_id: string) =>
    api.get<Vehicle[]>('/vehicles/by-customer', { params: { customer_id } }).then((r) => r.data),
  findOne: (id: string) => api.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),
  create: (data: { customer_id: string; plate: string; model: string; description?: string }) =>
    api.post<Vehicle>('/vehicles', data).then((r) => r.data),
  update: (id: string, data: Partial<{ plate: string; model: string; description: string }>) =>
    api.patch<Vehicle>(`/vehicles/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/vehicles/${id}`).then((r) => r.data),
};
