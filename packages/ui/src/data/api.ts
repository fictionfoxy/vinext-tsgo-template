import axios from 'axios';

/**
 * Pre-configured Axios instance.
 * Set VITE_API_BASE_URL in your app's .env to override the default '/api'.
 * Or at runtime: `api.defaults.baseURL = '/your-api'`
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
