// Central API configuration hook
import api, { BASE_URL, getCookie } from '@/lib/axios';

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
    // Job verification
    VERIFY_JOB: (jobId: string) => `/super-admin/verify/job/${jobId}`,
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
  ADMIN: {
    SIGNUP: `/admin/auth/signup`,
    LOGIN: `/admin/auth/login`,
    VERIFY_OTP: `/admin/auth/verify-otp`,
    RESEND_OTP: `/admin/auth/resend-otp`,
    FORGOT_PASSWORD: `/admin/auth/forgot-password`,
    RESET_PASSWORD: `/admin/auth/reset-password`,
    REFRESH_TOKEN: `/admin/auth/refresh-token`,
    LOGOUT: `/admin/auth/logout`,
    // Dashboard
    DASHBOARD_COUNTS: `/admin/dashboard/counts`,
    JOB_POSTS: (page = 1, limit = 10, search?: string, status?: string) => {
      let url = `/admin/job-post?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
      return url;
    },
    JOB_POST_COUNT: `/admin/job-post/count`,
    JOB_TITLES: (page = 1, limit = 10, search?: string) => {
      let url = `/admin/job-titles?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return url;
    },
    JOB_APPLICATIONS: (jobId: number, page = 1, limit = 10) => `/admin/job-applications/${jobId}?page=${page}&limit=${limit}`,
    CREATE_JOB: `/admin/job-post`,
    RENEW_JOB: (jobId: number) => `/admin/renew/job-post/${jobId}`,
    BILLING_PLANS: `/admin/billing-plans`,
    // Profile
    GET_PROFILE: `/admin/`,
    UPDATE_PROFILE: `/admin/update/profile`,
  },
  CANDIDATE: {
    JOB_POSTS: (page = 1, limit = 10, search?: string, country?: string, jobType?: string) => {
      let url = `/candidate/job-posts?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (country) url += `&country=${encodeURIComponent(country)}`;
      if (jobType) url += `&jobType=${encodeURIComponent(jobType)}`;
      return url;
    },
    UPLOAD_DOCUMENTS: `/candidate/upload/documents`,
    APPLY_JOB: (jobId: number) => `/candidate/job/application/${jobId}`,
  },
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

export { api, BASE_URL, getCookie };

export const useApi = () => {
  return {
    endpoints: API_ENDPOINTS,
    getCookie,
    apiRequest,
    api,
  };
};

export default useApi;
