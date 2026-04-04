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
    /** Super-admin invoice dashboard stats */
    INVOICE_COUNTS: `/super-admin/invoice/counts`,
    /** Super-admin invoice / recruiter billing list */
    INVOICE_LIST_ADMINS: `/super-admin/invoice/list/admins`,
    INVOICE_ADMIN_DETAIL: (adminId: string | number) => `/super-admin/invoice/admin/${adminId}`,
    /** Super-admin: download email list CSV (or file) for a recruiter list */
    EMAIL_LIST_DOWNLOAD: (adminId: string | number, listId: string | number) =>
      `/super-admin/email-list/download/${adminId}/${listId}`,
    /** Pause / resume email campaign (super-admin) — use PATCH */
    CAMPAIGN_PAUSE: (campaignId: string | number) => `/super-admin/campaign/pause/${campaignId}`,
    CAMPAIGN_RESUME: (campaignId: string | number) => `/super-admin/campaign/resume/${campaignId}`,
    /** Super-admin: email sending limits & usage for a recruiter (adminId) */
    SENDING_LIMITS: (adminId: string | number) => `/super-admin/email/sending-limits/${adminId}`,
    // Alerts
    ALERT_COUNT: `/super-admin/pay/alert-count`,
    // Payment requests (pending purchase / subscription feature requests)
    LIST_PENDING_PURCHASE_REQUESTS: `/super-admin/list/pending/purchase-requests`,
    VERIFY_FEATURE: (id: string | number) => `/super-admin/verify/feature/${id}`,
    // Job verification
    VERIFY_JOB: (jobId: string) => `/super-admin/verify/job/${jobId}`,
    // Features (singular path per API)
    LIST_FEATURES: `/super-admin/feature`,
    CREATE_FEATURE: `/super-admin/feature`,
    UPDATE_FEATURE: (id: string | number) => `/super-admin/feature/${id}`,
    ACTIVATE_FEATURE: (id: string | number) => `/super-admin/feature/activate/${id}`,
    DEACTIVATE_FEATURE: (id: string | number) => `/super-admin/feature/deactivate/${id}`,
    // Subscriptions (singular path per API)
    LIST_SUBSCRIPTIONS: `/super-admin/subscription`,
    CREATE_SUBSCRIPTION: `/super-admin/subscription`,
    UPDATE_SUBSCRIPTION: (id: string | number) => `/super-admin/subscription/${id}`,
    ACTIVATE_SUBSCRIPTION: (id: string | number) => `/super-admin/subscription/activate/${id}`,
    DEACTIVATE_SUBSCRIPTION: (id: string | number) => `/super-admin/subscription/deactivate/${id}`,
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
    /** Purchased subscription feature names for current recruiter */
    PURCHASED_FEATURES: `/admin/purchased/features`,
    /** Feature catalog/pricing for recruiter purchase flow */
    FEATURES_LIST: (page = 1, limit = 10) => `/admin/features?page=${page}&limit=${limit}`,
    PURCHASE_FEATURE: `/admin/purchase/feature`,
    /** Active subscription features for logged-in recruiter */
    CURRENT_PLAN: `/admin/current-plan`,
    // Email Broadcast — list labels from API; upload only
    SEND_EMAIL: `/admin/email-broadcast/send`,
    EMAIL_BROAD_CREATE_LIST: `/email-broad/create/list`,
    EMAIL_BROAD_UPLOAD: `/email-broad/upload`,
    EMAIL_BROAD_LIST_LABELS: `/email-broad/list/labels`,
    EMAIL_BROAD_CREATE_CAMPAIGN: `/email-broad/create-campaign`,
    /** Paginated campaigns by status (Processing, Completed, Failed, Queued, Scheduled) */
    EMAIL_BROAD_CAMPAIGNS: (page = 1, limit = 10, status: string, search?: string) => {
      let url = `/email-broad/campaigns?page=${page}&limit=${limit}&status=${encodeURIComponent(status)}`;
      if (search && search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      return url;
    },
    EMAIL_BROAD_ITEMS: (listId: number, page = 1, limit = 25, search?: string) => {
      let url = `/email-broad/items/${listId}?page=${page}&limit=${limit}`;
      if (search && search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      return url;
    },
    EMAIL_BROAD_DELETE_EMAILS: `/email-broad/emails`,
    EMAIL_BROAD_DELETE_LIST: (listId: number) => `/email-broad/list/${listId}`,
    // Email broadcast templates
    EMAIL_BROAD_TEMPLATE_LIST: (page = 1, limit = 10) => `/email-broad/template?page=${page}&limit=${limit}`,
    EMAIL_BROAD_TEMPLATE_CREATE: `/email-broad/template`,
    EMAIL_BROAD_TEMPLATE_UPDATE: (id: number) => `/email-broad/template/${id}`,
    EMAIL_BROAD_TEMPLATE_DELETE: (id: number) => `/email-broad/template/${id}`,
    EMAIL_BROAD_TEST_MAIL: `/email-broad/test-mail`,
    /** Public — opt out of marketing/job emails (no login). POST JSON `{ email }`. */
    EMAIL_BROAD_UNSUBSCRIBE: `/email-broad/unsubscribe`,
    // Notifications
    NOTIFICATIONS: (page = 1, limit = 10, type = 'subscription_expiry', isRead = false) =>
      `/admin/notifications?page=${page}&limit=${limit}&type=${encodeURIComponent(type)}&isRead=${isRead}`,
    NOTIFICATION_MARK_READ: (notificationId: number) => `/admin/notifications/${notificationId}/read`,
    NOTIFICATION_MARK_ALL_READ: `/admin/notifications/read-all`,
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
