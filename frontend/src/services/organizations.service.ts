import apiClient from './api.client';
import { Organization } from '../types';

export const orgsApi = {
  create: (name: string) =>
    apiClient.post<Organization>('/orgs', { name }).then((r) => r.data),

  list: () =>
    apiClient.get<Organization[]>('/orgs').then((r) => r.data),
};
