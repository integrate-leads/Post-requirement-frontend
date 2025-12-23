import axios from 'axios';

const BASE_URL = 'https://devapi.integrateleads.com';

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

// Get user type from localStorage to determine correct refresh endpoint
const getRefreshEndpoint = (): string => {
  const storedUser = localStorage.getItem('auth_user');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    if (user.role === 'super_admin') {
      return '/super-admin/auth/refresh-token';
    }
  }
  return '/recruiter/auth/refresh-token';
};

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        // Call refresh token endpoint
        const refreshEndpoint = getRefreshEndpoint();
        await api.get(refreshEndpoint);
        
        // Refresh successful - tokens are automatically set in cookies
        processQueue();
        isRefreshing = false;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        
        // Refresh failed - clear user data and redirect to login
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { BASE_URL };
