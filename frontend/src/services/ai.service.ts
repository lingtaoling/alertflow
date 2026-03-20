import apiClient from './api.client';

export type SuggestAlertResponse = { title: string; description: string };

export const aiApi = {
  suggestAlert(titleDraft: string) {
    return apiClient
      .post<SuggestAlertResponse>('/ai/alerts/suggest', { title: titleDraft }, { timeout: 90000 })
      .then((r) => r.data);
  },
};
