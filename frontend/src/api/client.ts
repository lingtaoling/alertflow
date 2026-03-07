import axios from 'axios';
import { store } from '../store';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach tenant headers from Redux store
apiClient.interceptors.request.use((config) => {
  const state = store.getState();
  const { orgId, userId } = state.auth;
  if (orgId) config.headers['X-Org-Id'] = orgId;
  if (userId) config.headers['X-User-Id'] = userId;
  return config;
});

// Response error interceptor
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Unknown error';
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
