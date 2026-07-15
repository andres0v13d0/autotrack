import axios from 'axios';

export interface IntakeForm {
  id: string;
  work_order_id: string;
  client_name: string;
  client_phone: string;
  vehicle_plate: string;
  vehicle_model: string;
  mileage_in?: number;
  vehicle_condition?: string;
  problem_description: string;
  client_signature?: string;
  signed: boolean;
  created_at: string;
  signed_at?: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const intakeFormService = {
  create: (workOrderId: string, data: Partial<IntakeForm>): Promise<IntakeForm> =>
    api.post(`/work-orders/${workOrderId}/intake-form`, data).then((res) => res.data),

  getByWorkOrder: (workOrderId: string): Promise<IntakeForm | null> =>
    api.get(`/work-orders/${workOrderId}/intake-form`)
      .then((res) => res.data)
      .catch((err) => {
        if (err.response?.status === 404) {
          return null;
        }
        throw err;
      }),

  update: (intakeFormId: string, data: Partial<IntakeForm>): Promise<IntakeForm> =>
    api.patch(`/work-orders/intake-form/${intakeFormId}`, data).then((res) => res.data),

  delete: (intakeFormId: string): Promise<void> =>
    api.delete(`/work-orders/intake-form/${intakeFormId}`).then(() => undefined),
};
