import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || ''; // Relative in production, or localhost if VITE_API_URL is set

const api = axios.create({
  baseURL: `${API_URL}/api`,
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

// Handle 401s globally
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
