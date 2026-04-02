import axios from 'axios';

// FORCE relative path in production, and standard development path otherwise
// This eliminates the /api/api duplication by ensuring we don't double-concatenate.
const isProd = import.meta.env.PROD;
const baseURL = isProd ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Add token from localStorage as fallback
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rehome_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Avoid app-wide crashes on API failures
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // If we catch a 500 error on boot, we should log it but NOT unmount the React app
    console.error('API Error:', err.response?.status, err.message);
    if (err.response?.status === 401) {
      localStorage.removeItem('rehome_token');
      localStorage.removeItem('rehome_user');
    }
    return Promise.reject(err);
  }
);

export default api;
