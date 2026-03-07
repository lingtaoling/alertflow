import apiClient from './api.client';
import { User } from '../types';

export const usersApi = {
  create: (data: { name: string; email: string; orgId: string; password: string }) =>
    apiClient.post<User>('/users', data).then((r) => r.data),

  listByOrg: () =>
    apiClient.get<User[]>('/users').then((r) => r.data),
};
