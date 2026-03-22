import apiClient from './api.client';

export type SuggestAlertResponse = { title: string; description: string };

export type AnalyticsQueryResponse =
  | { alertAnalytics: false }
  | { alertAnalytics: true; answer: string };

export const aiApi = {
  suggestAlert(titleDraft: string) {
    return apiClient
      .post<SuggestAlertResponse>('/ai/alerts/suggest', { title: titleDraft }, { timeout: 90000 })
      .then((r) => r.data);
  },

  analyticsQuery(query: string) {
    return apiClient
      .post<AnalyticsQueryResponse>('/ai/analytics/query', { query }, { timeout: 90000 })
      .then((r) => r.data);
  },
};
