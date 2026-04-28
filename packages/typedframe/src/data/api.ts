import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * Override `baseURL` at the app level by creating a second instance with
 * `api.create({ baseURL: '/your-api' })` or by setting VITE_API_BASE_URL.
 */
export const api = axios.create({
  baseURL: typeof import.meta !== 'undefined' && (import.meta as Record<string, unknown>).env
    ? ((import.meta as { env: Record<string, string> }).env.VITE_API_BASE_URL ?? '/api')
    : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
