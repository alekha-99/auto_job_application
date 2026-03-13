import axios from 'axios';

// Create an Axios instance with base URL from environment variables
// Fallback to localhost if not provided
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    // We check if we are in the browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwtToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Handle token expiration globally (e.g., dispatch logout or redirect)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwtToken');
        // A simple reload will let the AuthGuard redirect to login
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
