import apiClient from './api.client';
import { Organization, User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient
      .post<{ accessToken: string; user: User; org: Organization }>('/auth/login', { email, password })
      .then((r) => r.data),
};
