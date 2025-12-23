import axios from 'axios';

const BASE_URL = 'https://devapi.integrateleads.com';

// Helper to get cookie value
const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
};

// Store user role in memory (not localStorage)
let userRole: 'super_admin' | 'recruiter' | null = null;

export const setUserRole = (role: 'super_admin' | 'recruiter' | null) => {
  userRole = role;
};

export const getUserRole = () => userRole;

// Create axios instance with defaults
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Get refresh endpoint based on user role
const getRefreshEndpoint = (): string => {
  if (userRole === 'super_admin') {
    return '/super-admin/auth/refresh-token';
  }
  return '/recruiter/auth/refresh-token';
};

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getCookie('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if we have a refresh token
      const refreshToken = getCookie('refreshToken');
      if (!refreshToken) {
        // No refresh token, redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh token endpoint - cookies are sent automatically
        const refreshEndpoint = getRefreshEndpoint();
        await api.get(refreshEndpoint);
        
        // Refresh successful - new tokens are set in cookies by server
        processQueue();
        isRefreshing = false;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        
        // Refresh failed - redirect to login
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { BASE_URL, getCookie };
