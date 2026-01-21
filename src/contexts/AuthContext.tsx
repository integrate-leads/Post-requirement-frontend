import React from 'react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { setUserRole, setAccessToken, setRefreshToken } from '@/lib/axios';

export type UserRole = 'super_admin' | 'recruiter' | 'freelancer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  companyWebsite?: string;
  phone?: string;
  postalAddress?: string;
  approvedServices: string[];
}

interface AuthContextType {
  user: User | null;
  /** true when cookie auth exists OR user is set */
  isAuthenticated: boolean;
  /** true while checking auth state on initial load */
  isAuthLoading: boolean;
  login: (email: string, password: string, isSuperAdminRoute?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string, isSuperAdminRoute?: boolean) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (otp: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  pendingEmail: string | null;
  pendingSignup: SignupData | null;
  isSuperAdmin: boolean;
}

export interface SignupData {
  userType: 'recruiter' | 'freelancer';
  fullName: string;
  email: string;
  phone: string;
  password: string;
  company?: string;
  companyWebsite?: string;
  postalAddress?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// NOTE: token/refreshToken are expected to be HttpOnly cookies set by the backend.
// We must NOT try to mirror them into JS-readable cookies (can conflict / get out of sync).
// Instead, we rely on withCredentials + a bootstrap refresh call on app start.

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingSignup, setPendingSignup] = useState<SignupData | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Get endpoints based on isSuperAdmin state (determined by route, not email)
  const getEndpoints = useCallback(() => {
    return isSuperAdmin ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
  }, [isSuperAdmin]);

  // Bootstrap auth on refresh: Only try to refresh if we have stored tokens.
  // If no tokens exist, user is not logged in - don't call refresh API.
  React.useEffect(() => {
    const path = window.location.pathname;
    const superAdminRoute = path.startsWith('/super-admin');
    const isProtectedRoute = path.startsWith('/recruiter') || path.startsWith('/super-admin');

    // Determine role for refresh routing (axios interceptor)
    setIsSuperAdmin(superAdminRoute);
    setUserRole(superAdminRoute ? 'super_admin' : 'admin');

    let cancelled = false;

    (async () => {
      // Check if we have stored tokens in sessionStorage
      const storedAccessToken = sessionStorage.getItem('accessToken');
      const storedRefreshToken = sessionStorage.getItem('refreshToken');
      
      // If no tokens stored, user is not logged in - skip refresh API call
      if (!storedAccessToken && !storedRefreshToken) {
        setIsAuthLoading(false);
        setIsAuthenticated(false);
        return;
      }

      // We have tokens - try to use them directly first, only refresh if needed
      try {
        // Try to fetch profile/dashboard to verify token is still valid
        if (!superAdminRoute) {
          try {
            const profileRes = await api.get<any>(API_ENDPOINTS.ADMIN.GET_PROFILE);
            const p = profileRes?.data ?? {};
            if (cancelled) return;
            
            setUser({
              id: String(p.id ?? p._id ?? ''),
              email: String(p.email ?? ''),
              name: String(p.name ?? p.fullName ?? 'User'),
              role: 'recruiter',
              approvedServices: Array.isArray(p.approvedServices) ? p.approvedServices : [],
            });
            setIsAuthenticated(true);
          } catch (profileError: any) {
            // If profile fetch returns 401, the axios interceptor will handle token refresh
            // If refresh also fails, axios interceptor will redirect to login
            // If it succeeds after refresh, we need to retry the profile fetch
            if (profileError?.response?.status === 401) {
              // Token was invalid, interceptor would have tried to refresh
              // If we get here, refresh failed - user needs to re-login
              setAccessToken(null);
              setRefreshToken(null);
              setIsAuthenticated(false);
              setUser(null);
            } else {
              // Network error or other issue - still treat as authenticated if we have tokens
              setUser({
                id: '',
                email: '',
                name: 'User',
                role: 'recruiter',
                approvedServices: [],
              });
              setIsAuthenticated(true);
            }
          }
        } else {
          // For super admin, try to get dashboard info
          try {
            const dashboardRes = await api.get<any>('/super-admin/dashboard');
            if (cancelled) return;
            
            const adminEmail = dashboardRes?.data?.data?.email || dashboardRes?.data?.email || '';
            setUser({
              id: '',
              email: adminEmail,
              name: 'Super Admin',
              role: 'super_admin',
              approvedServices: [],
            });
            setIsAuthenticated(true);
          } catch (dashboardError: any) {
            if (dashboardError?.response?.status === 401) {
              // Token was invalid and refresh failed
              setAccessToken(null);
              setRefreshToken(null);
              setIsAuthenticated(false);
              setUser(null);
            } else {
              // Network error or other issue - still treat as authenticated if we have tokens
              setUser({
                id: '',
                email: '',
                name: 'Super Admin',
                role: 'super_admin',
                approvedServices: [],
              });
              setIsAuthenticated(true);
            }
          }
        }
      } catch {
        if (cancelled) return;
        // Clear any stale tokens and stay logged out
        setAccessToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string, isSuperAdminRoute = false): Promise<{ success: boolean; error?: string }> => {
    // Determine API based on route, not email
    const endpoints = isSuperAdminRoute ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
    setIsSuperAdmin(isSuperAdminRoute);

    // Set user role for axios interceptor (refresh endpoint routing)
    setUserRole(isSuperAdminRoute ? 'super_admin' : 'admin');

    try {
      await api.post(endpoints.LOGIN, { email, password });
      setPendingEmail(email.toLowerCase());
      setPendingSignup(null);
      // Login starts OTP flow; don't mark authenticated until OTP is verified.
      setIsAuthenticated(false);
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { success: false, error: axiosError.response?.data?.message || 'Login failed' };
    }
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    setPendingSignup(data);
    setPendingEmail(data.email.toLowerCase());
    setIsSuperAdmin(false);
    setUserRole('admin');

    try {
      // Call Admin signup API
      await api.post(API_ENDPOINTS.ADMIN.SIGNUP, {
        email: data.email,
        password: data.password,
        name: data.fullName,
        mobile: data.phone,
        companyName: data.company || '',
        companyWebsite: data.companyWebsite || '',
        address: data.postalAddress || '',
        idProof: [],
      });
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { success: false, error: axiosError.response?.data?.message || 'Signup failed' };
    }
  };

  const verifyOtp = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingEmail) {
      return { success: false, error: 'No pending email found' };
    }

    const endpoints = getEndpoints();

    try {
      const response = await api.post<{
        success?: boolean;
        accessToken?: string;
        refreshToken?: string;
        user?: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
        };
      }>(endpoints.VERIFY_OTP, { email: pendingEmail, otp });

      // Store tokens in memory/sessionStorage for axios Authorization header (if backend returns them in body)
      if (response.data?.accessToken) {
        setAccessToken(response.data.accessToken);
      }
      if (response.data?.refreshToken) {
        setRefreshToken(response.data.refreshToken);
      }

      let newUser: User;

      if (pendingSignup) {
        newUser = {
          id: response.data?.user?.id || Math.random().toString(36).substr(2, 9),
          email: pendingEmail,
          name: pendingSignup.fullName,
          role: pendingSignup.userType,
          company: pendingSignup.company,
          companyWebsite: pendingSignup.companyWebsite,
          phone: pendingSignup.phone,
          postalAddress: pendingSignup.postalAddress,
          approvedServices: [],
        };
      } else {
        newUser = {
          id: response.data?.user?.id || Math.random().toString(36).substr(2, 9),
          email: pendingEmail,
          name: response.data?.user?.name || (isSuperAdmin ? 'Super Admin' : 'User'),
          role: response.data?.user?.role || (isSuperAdmin ? 'super_admin' : 'recruiter'),
          approvedServices: [],
        };
      }

      // Update user role in axios interceptor
      setUserRole(newUser.role === 'super_admin' ? 'super_admin' : 'admin');

      setUser(newUser);
      setIsAuthenticated(true);
      setPendingEmail(null);
      setPendingSignup(null);
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { success: false, error: axiosError.response?.data?.message || 'OTP verification failed' };
    }
  };

  const resendOtp = async (): Promise<{ success: boolean; error?: string }> => {
    if (!pendingEmail) {
      return { success: false, error: 'No pending email found' };
    }

    const endpoints = getEndpoints();

    try {
      await api.post(endpoints.RESEND_OTP, { email: pendingEmail });
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { success: false, error: axiosError.response?.data?.message || 'Failed to resend OTP' };
    }
  };

  const forgotPassword = async (email: string, isSuperAdminRoute = false): Promise<{ success: boolean; error?: string }> => {
    // Determine API based on route, not email
    const endpoints = isSuperAdminRoute ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
    setPendingEmail(email.toLowerCase());
    setIsSuperAdmin(isSuperAdminRoute);
    setUserRole(isSuperAdminRoute ? 'super_admin' : 'admin');

    try {
      await api.post(endpoints.FORGOT_PASSWORD, { email });
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { success: false, error: axiosError.response?.data?.message || 'Failed to send reset email' };
    }
  };

  const resetPassword = async (
    otp: string,
    password: string,
    confirmPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!pendingEmail) {
      return { success: false, error: 'No pending email found' };
    }

    const endpoints = getEndpoints();

    try {
      await api.post(endpoints.RESET_PASSWORD, {
        email: pendingEmail,
        otp,
        password,
        confirmPassword,
      });
      setPendingEmail(null);
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { success: false, error: axiosError.response?.data?.message || 'Failed to reset password' };
    }
  };

  const logout = async () => {
    if (user) {
      try {
        const endpoints = isSuperAdmin ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
        await api.post(endpoints.LOGOUT);
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }

    // Clear tokens from memory
    setAccessToken(null);
    setRefreshToken(null);
    
    setUser(null);
    setPendingEmail(null);
    setPendingSignup(null);
    setIsSuperAdmin(false);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAuthLoading,
        login,
        signup,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
        pendingEmail,
        pendingSignup,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
