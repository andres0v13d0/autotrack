import api from './api';
import type { Settings } from '../types/settings';

export const settingsService = {
  getSettings: () => api.get<Settings>('/settings').then((r) => r.data),
  updateSettings: (data: Partial<Settings>) =>
    api.patch<Settings>('/settings', data).then((r) => r.data),
};
