import axios from 'axios';

const BASE_URL = 'https://devapi.integrateleads.com';

// Helper to get cookie value (may return null for HttpOnly cookies)
const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
};

// Store user role in memory AND sessionStorage (non-sensitive) so refresh routing works after page reload.
let userRole: 'super_admin' | 'recruiter' | 'admin' | null =
  (sessionStorage.getItem('userRole') as any) || null;

export const setUserRole = (role: 'super_admin' | 'recruiter' | 'admin' | null) => {
  userRole = role;
  if (role) sessionStorage.setItem('userRole', role);
  else sessionStorage.removeItem('userRole');
};

export const getUserRole = () => userRole;

// Store tokens in memory AND sessionStorage for persistence across refreshes
let accessToken: string | null = sessionStorage.getItem('accessToken');
let refreshTokenValue: string | null = sessionStorage.getItem('refreshToken');

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    sessionStorage.setItem('accessToken', token);
  } else {
    sessionStorage.removeItem('accessToken');
  }
};

export const getAccessToken = () => accessToken;

export const setRefreshToken = (token: string | null) => {
  refreshTokenValue = token;
  if (token) {
    sessionStorage.setItem('refreshToken', token);
  } else {
    sessionStorage.removeItem('refreshToken');
  }
};

export const getRefreshToken = () => refreshTokenValue;

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

// Get refresh endpoint based on user role.
// IMPORTANT: after a full page reload, infer from pathname if role isn't known yet.
const getRefreshEndpoint = (): string => {
  const inferred = (() => {
    if (userRole) return userRole;
    const path = window.location.pathname;
    if (path.startsWith('/super-admin')) return 'super_admin';
    // This app uses ADMIN auth endpoints for the /recruiter routes.
    if (path.startsWith('/recruiter')) return 'admin';
    return null;
  })();

  if (inferred === 'super_admin') return '/super-admin/auth/refresh-token';
  if (inferred === 'admin') return '/admin/auth/refresh-token';
  return '/recruiter/auth/refresh-token';
};

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    // First try in-memory token, then fall back to cookie
    const token = accessToken || getCookie('token');
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
      // IMPORTANT: refreshToken is usually an HttpOnly cookie (not readable from JS).
      // Do NOT gate refresh attempts on document.cookie. If the cookie exists,
      // it will still be sent automatically withCredentials.

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
        const refreshResponse = await api.get<{
          accessToken?: string;
          refreshToken?: string;
        }>(refreshEndpoint);
        
        // If tokens are returned in body, store them in memory AND sessionStorage
        if (refreshResponse.data?.accessToken) {
          setAccessToken(refreshResponse.data.accessToken);
        }
        if (refreshResponse.data?.refreshToken) {
          setRefreshToken(refreshResponse.data.refreshToken);
        }
        
        // Refresh successful
        processQueue();
        isRefreshing = false;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        
        // Clear stale tokens from memory and sessionStorage
        setAccessToken(null);
        setRefreshToken(null);
        setUserRole(null);
        
        // Refresh failed - redirect to login
        const path = window.location.pathname;
        if (path.startsWith('/super-admin')) {
          window.location.href = '/super-admin/login';
        } else if (path.startsWith('/recruiter')) {
          window.location.href = '/recruiter/login';
        } else {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { BASE_URL, getCookie };
