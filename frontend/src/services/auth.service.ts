import api from './api';
import type { LoginResponse } from '../types';

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  
  register: (payload: RegisterPayload) =>
    api.post<LoginResponse>('/auth/register', payload).then((r) => r.data),
};
