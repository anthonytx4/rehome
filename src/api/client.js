import axios from 'axios';

// Get the API URL from the environment, defaulting to an empty string for relative paths
const VITE_API_URL = import.meta.env.VITE_API_URL || '';

// Defensive logic to prevent double-concatenation (/api/api)
// 1. If VITE_API_URL is empty, we use '/api' to stay relative to the current domain.
// 2. If it already contains '/api', we use it as-is.
// 3. Otherwise, we append '/api'.
const baseURL = VITE_API_URL 
  ? (VITE_API_URL.endsWith('/api') ? VITE_API_URL : `${VITE_API_URL}/api`) 
  : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Add token from localStorage as fallback for non-cookie requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rehome_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized globally to clear sessions
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rehome_token');
      localStorage.removeItem('rehome_user');
    }
    return Promise.reject(err);
  }
);

export default api;
