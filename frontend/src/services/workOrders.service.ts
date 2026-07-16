/**
 * WORK ORDERS SERVICE — Connected to real backend API
 *
 * Endpoints available:
 * GET    /work-orders?vehicleId=:id
 * GET    /work-orders/:id
 * POST   /work-orders
 * POST   /work-orders/:id/items
 * DELETE /work-orders/:id/items/:itemId
 */

import axios from 'axios';
import type { WorkOrder } from '../types/workOrder';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const workOrdersService = {
  /** GET /work-orders */
  findAll: (): Promise<WorkOrder[]> =>
    api.get('/work-orders').then((res) => res.data),

  /** GET /work-orders?vehicleId=:id */
  getByVehicle: (vehicleId: string): Promise<WorkOrder[]> =>
    api.get('/work-orders/vehicle/' + vehicleId).then((res) => res.data),

  /** GET /work-orders/:id */
  getOne: (id: string): Promise<WorkOrder> =>
    api.get(`/work-orders/${id}`).then((res) => res.data),

  /** POST /work-orders */
  create: (vehicleId: string, descriptionNeeded: string, customerId?: string): Promise<WorkOrder> =>
    api
      .post('/work-orders', {
        vehicle_id: vehicleId,
        description_needed: descriptionNeeded,
        customer_id: customerId,
      })
      .then((res) => res.data),

  /** POST /work-orders/:id/items */
  addItem: (
    workOrderId: string,
    item: { name: string; price: number; qty: number },
  ): Promise<WorkOrder> =>
    api.post(`/work-orders/${workOrderId}/items`, item).then((res) => res.data),

  /** DELETE /work-orders/:id/items/:itemId */
  removeItem: (workOrderId: string, itemId: string): Promise<WorkOrder> =>
    api.delete(`/work-orders/${workOrderId}/items/${itemId}`).then((res) => res.data),

  /** PATCH /work-orders/:id */
  update: (workOrderId: string, data: { tax_rate?: number; delivery_status?: string }): Promise<WorkOrder> =>
    api.patch(`/work-orders/${workOrderId}`, data).then((res) => res.data),

  /** PATCH /work-orders/:id - Update description */
  updateDescription: (workOrderId: string, description_needed: string): Promise<WorkOrder> =>
    api.patch(`/work-orders/${workOrderId}`, { description_needed }).then((res) => res.data),
};
