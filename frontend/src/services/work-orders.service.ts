import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UpdateWorkOrderDto {
  tax_rate?: number;
  delivery_status?: 'new' | 'in_progress' | 'ready' | 'picked_up';
  description_needed?: string;
}

export const workOrdersService = {
  findAll: async () => {
    const response = await api.get('/work-orders');
    return response.data;
  },

  findOne: async (id: string) => {
    const response = await api.get(`/work-orders/${id}`);
    return response.data;
  },

  create: async (dto: any) => {
    const response = await api.post('/work-orders', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateWorkOrderDto) => {
    const response = await api.patch(`/work-orders/${id}`, dto);
    return response.data;
  },

  updateDeliveryStatus: async (id: string, status: 'new' | 'in_progress' | 'ready' | 'picked_up') => {
    return workOrdersService.update(id, { delivery_status: status });
  },

  addItem: async (id: string, itemData: any) => {
    const response = await api.post(`/work-orders/${id}/items`, itemData);
    return response.data;
  },

  removeItem: async (workOrderId: string, itemId: string) => {
    const response = await api.delete(`/work-orders/${workOrderId}/items/${itemId}`);
    return response.data;
  },

  findByVehicle: async (vehicleId: string) => {
    const response = await api.get(`/work-orders/vehicle/${vehicleId}`);
    return response.data;
  },

  getPdfData: async (id: string) => {
    const response = await api.get(`/work-orders/${id}/pdf-data`);
    return response.data;
  },

  getIntakeForm: async (workOrderId: string) => {
    const response = await api.get(`/work-orders/${workOrderId}/intake-form`);
    return response.data;
  },

  createIntakeForm: async (workOrderId: string, data: any) => {
    const response = await api.post(`/work-orders/${workOrderId}/intake-form`, data);
    return response.data;
  },

  updateIntakeForm: async (intakeFormId: string, data: any) => {
    const response = await api.patch(`/work-orders/intake-form/${intakeFormId}`, data);
    return response.data;
  },

  deleteIntakeForm: async (intakeFormId: string) => {
    const response = await api.delete(`/work-orders/intake-form/${intakeFormId}`);
    return response.data;
  },
};
