// Central API configuration hook
const BASE_URL = 'https://devapi.integrateleads.com';

export const API_ENDPOINTS = {
  SUPER_ADMIN: {
    LOGIN: `${BASE_URL}/super-admin/auth/login`,
    VERIFY_OTP: `${BASE_URL}/super-admin/auth/verify-otp`,
    RESEND_OTP: `${BASE_URL}/super-admin/auth/resend-otp`,
    FORGOT_PASSWORD: `${BASE_URL}/super-admin/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/super-admin/auth/reset-password`,
    REFRESH_TOKEN: `${BASE_URL}/super-admin/auth/refresh-token`,
    LOGOUT: `${BASE_URL}/super-admin/auth/logout`,
    // Dashboard
    DASHBOARD_COUNTS: `${BASE_URL}/super-admin/dashboard/counts`,
    // Recruiters/Admins
    LIST_ADMINS: `${BASE_URL}/super-admin/list/admins`,
    VIEW_ADMIN: (id: string) => `${BASE_URL}/super-admin/view/admin/${id}`,
    BLOCK_ADMIN: (id: string) => `${BASE_URL}/super-admin/block/admin/${id}`,
    UNBLOCK_ADMIN: (id: string) => `${BASE_URL}/super-admin/unblock/admin/${id}`,
    DELETE_ADMIN: (id: string) => `${BASE_URL}/super-admin/delete/admin/${id}`,
    CREATE_ADMIN: `${BASE_URL}/super-admin/create/admin`,
    // Jobs
    LIST_JOBS: `${BASE_URL}/super-admin/list/jobs`,
    ADMIN_JOBS: (adminId: string, page = 1, limit = 10) => `${BASE_URL}/super-admin/jobs/${adminId}?page=${page}&limit=${limit}`,
    // Alerts
    ALERT_COUNT: `${BASE_URL}/super-admin/pay/alert-count`,
  },
  RECRUITER: {
    LOGIN: `${BASE_URL}/recruiter/auth/login`,
    VERIFY_OTP: `${BASE_URL}/recruiter/auth/verify-otp`,
    RESEND_OTP: `${BASE_URL}/recruiter/auth/resend-otp`,
    FORGOT_PASSWORD: `${BASE_URL}/recruiter/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/recruiter/auth/reset-password`,
    REFRESH_TOKEN: `${BASE_URL}/recruiter/auth/refresh-token`,
    LOGOUT: `${BASE_URL}/recruiter/auth/logout`,
  },
};

// Cookie utilities
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

// API helper function
export const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> => {
  try {
    const accessToken = getCookie('access_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
};

export const useApi = () => {
  return {
    endpoints: API_ENDPOINTS,
    setCookie,
    getCookie,
    deleteCookie,
    apiRequest,
  };
};

export default useApi;
