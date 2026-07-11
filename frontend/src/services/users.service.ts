import api from './api';
import type { User } from '../types';

export const usersService = {
  findAll: () => api.get<User[]>('/users').then((r) => r.data),
  findOne: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<User>('/users', data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; email: string; password: string; role: string }>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
};
