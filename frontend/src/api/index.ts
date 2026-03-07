import apiClient from './client';
import { Alert, AlertEvent, AlertStatus, Organization, User, PaginatedResult } from '../types';

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient
      .post<{ accessToken: string; user: User; org: Organization }>('/auth/login', { email, password })
      .then((r) => r.data),
};

// Organizations
export const orgsApi = {
  create: (name: string) =>
    apiClient.post<Organization>('/orgs', { name }).then((r) => r.data),

  list: () =>
    apiClient.get<Organization[]>('/orgs').then((r) => r.data),
};

// Users
export const usersApi = {
  create: (data: { name: string; email: string; orgId: string; password: string }) =>
    apiClient.post<User>('/users', data).then((r) => r.data),

  listByOrg: () =>
    apiClient.get<User[]>('/users').then((r) => r.data),
};

// Alerts
export const alertsApi = {
  create: (data: { title: string; description?: string }) =>
    apiClient.post<Alert>('/alerts', data).then((r) => r.data),

  list: (params?: { status?: AlertStatus; limit?: number; offset?: number }) =>
    apiClient
      .get<PaginatedResult<Alert>>('/alerts', { params })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Alert>(`/alerts/${id}`).then((r) => r.data),

  updateStatus: (id: string, data: { status: AlertStatus; note?: string }) =>
    apiClient.patch<Alert>(`/alerts/${id}/status`, data).then((r) => r.data),

  getEvents: (id: string) =>
    apiClient.get<AlertEvent[]>(`/alerts/${id}/events`).then((r) => r.data),
};

// Health
export const healthApi = {
  check: () => apiClient.get('/health').then((r) => r.data),
};
