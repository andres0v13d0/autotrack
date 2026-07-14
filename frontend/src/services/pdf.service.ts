import axios from 'axios';
import { generateAndDownloadPdf } from '../components/WorkOrderPDF';
import type { WorkOrder } from '../types/workOrder';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const pdfService = {
  getPdfData: async (workOrderId: string): Promise<{ workOrder: WorkOrder; settings: any }> => {
    try {
      const response = await api.get(`/work-orders/${workOrderId}/pdf-data`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch PDF data:', error);
      throw error;
    }
  },

  downloadWorkOrderPdf: async (workOrderId: string, customTaxRate?: number) => {
    try {
      const { workOrder, settings } = await pdfService.getPdfData(workOrderId);
      if (customTaxRate !== undefined) {
        workOrder.tax_rate = customTaxRate;
      }
      await generateAndDownloadPdf(workOrder, settings);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  },
};
