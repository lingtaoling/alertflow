import axios, { AxiosError } from 'axios';
import { store } from '../store';
import { clearSession } from '../store/slices/authSlice';

/** Decodes a JWT payload without verifying signature (server handles that). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Returns true if the JWT exp claim is in the past. */
function isTokenExpired(payload: Record<string, unknown>): boolean {
  return typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000;
}

const PUBLIC_PATHS = ['/auth/login'];

/** When serving separately (e.g. npm run serve), set VITE_API_BASE_URL=http://localhost:3000 */
const apiBase = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
  : '/api';

const apiClient = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  const isPublic = PUBLIC_PATHS.some((p) => config.url?.includes(p));

  if (!token && !isPublic) {
    // No token for a protected route — cancel and redirect
    store.dispatch(clearSession());
    window.location.href = '/login';
    return Promise.reject(new Error('No authentication token'));
  }

  if (token) {
    const payload = decodeJwtPayload(token);

    if (payload && isTokenExpired(payload) && !isPublic) {
      // Token exists but is expired — clear session and redirect
      store.dispatch(clearSession());
      window.location.href = '/login';
      return Promise.reject(new Error('Token expired'));
    }

    config.headers.Authorization = `Bearer ${token}`;

    if (payload?.role) {
      config.headers['role'] = payload.role as string;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      store.dispatch(clearSession());
      window.location.href = '/login';
    }
    const raw = (err.response?.data as { message?: string | string[] })?.message;
    const message =
      (Array.isArray(raw) ? raw[0] : raw) || err.message || 'Unknown error';
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
