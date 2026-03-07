import apiClient from './api.client';
import { Alert, AlertEvent, AlertStatus, PaginatedResult } from '../types';

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
