// Central API configuration hook
import api, { BASE_URL } from '@/lib/axios';

export const API_ENDPOINTS = {
  SUPER_ADMIN: {
    LOGIN: `/super-admin/auth/login`,
    VERIFY_OTP: `/super-admin/auth/verify-otp`,
    RESEND_OTP: `/super-admin/auth/resend-otp`,
    FORGOT_PASSWORD: `/super-admin/auth/forgot-password`,
    RESET_PASSWORD: `/super-admin/auth/reset-password`,
    REFRESH_TOKEN: `/super-admin/auth/refresh-token`,
    LOGOUT: `/super-admin/auth/logout`,
    // Dashboard
    DASHBOARD_COUNTS: `/super-admin/dashboard/counts`,
    // Recruiters/Admins
    LIST_ADMINS: `/super-admin/list/admins`,
    VIEW_ADMIN: (id: string) => `/super-admin/view/admin/${id}`,
    BLOCK_ADMIN: (id: string) => `/super-admin/block/admin/${id}`,
    UNBLOCK_ADMIN: (id: string) => `/super-admin/unblock/admin/${id}`,
    DELETE_ADMIN: (id: string) => `/super-admin/delete/admin/${id}`,
    CREATE_ADMIN: `/super-admin/create/admin`,
    // Jobs
    LIST_JOBS: `/super-admin/list/jobs`,
    ADMIN_JOBS: (adminId: string, page = 1, limit = 10) => `/super-admin/jobs/${adminId}?page=${page}&limit=${limit}`,
    // Alerts
    ALERT_COUNT: `/super-admin/pay/alert-count`,
  },
  RECRUITER: {
    LOGIN: `/recruiter/auth/login`,
    VERIFY_OTP: `/recruiter/auth/verify-otp`,
    RESEND_OTP: `/recruiter/auth/resend-otp`,
    FORGOT_PASSWORD: `/recruiter/auth/forgot-password`,
    RESET_PASSWORD: `/recruiter/auth/reset-password`,
    REFRESH_TOKEN: `/recruiter/auth/refresh-token`,
    LOGOUT: `/recruiter/auth/logout`,
  },
};

// Legacy exports for backward compatibility - now use axios
export const setCookie = (name: string, value: string, minutes: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + minutes * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Token refresh interval (14 minutes to refresh before 15 min expiry)
export const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

// API helper function using axios
export const apiRequest = async <T>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: unknown;
    params?: Record<string, unknown>;
  } = {}
): Promise<{ data?: T; error?: string }> => {
  try {
    const { method = 'GET', data, params } = options;
    
    const response = await api.request<T>({
      url,
      method,
      data,
      params,
    });

    return { data: response.data };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { error: axiosError.response?.data?.message || 'An error occurred' };
    }
    return { error: 'Network error. Please try again.' };
  }
};

export { api, BASE_URL };

export const useApi = () => {
  return {
    endpoints: API_ENDPOINTS,
    setCookie,
    getCookie,
    deleteCookie,
    apiRequest,
    api,
  };
};

export default useApi;
