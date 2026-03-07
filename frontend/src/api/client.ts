import axios, { AxiosError } from 'axios';
import { store } from '../store';
import { clearSession } from '../store/slices/authSlice';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach JWT to all requests (except login)
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: handle 401 by clearing session
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      store.dispatch(clearSession());
      window.location.href = '/login';
    }
    const message = (err.response?.data as { message?: string })?.message || err.message || 'Unknown error';
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
