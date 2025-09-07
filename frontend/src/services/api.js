import axios from 'axios';

// In production, use relative URL since frontend is served from backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable cookies for refresh tokens
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor will be handled by AuthContext

export default api;