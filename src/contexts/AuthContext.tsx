import React from 'react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { getUserRole, getAccessToken, setUserRole, setAccessToken, setRefreshToken } from '@/lib/axios';

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
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingSignup, setPendingSignup] = useState<SignupData | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // Track if user just verified OTP to skip bootstrap check
  const [justVerified, setJustVerified] = useState(false);

  // Get endpoints based on isSuperAdmin state (determined by route, not email)
  const getEndpoints = useCallback(() => {
    return isSuperAdmin ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
  }, [isSuperAdmin]);

  // Bootstrap auth on refresh:
  // - For protected routes AND login routes, try a cheap authenticated request.
  // - If the access token is expired, the axios interceptor will refresh on 401 and retry.
  // - If justVerified is true, skip bootstrap (user just logged in via OTP).
  // - For login routes: if auth succeeds, redirect to dashboard; if fails, stay on login.
  React.useEffect(() => {
    // Skip bootstrap if user just verified OTP
    if (justVerified) {
      setIsAuthLoading(false);
      return;
    }

    const path = location.pathname;
    const superAdminRoute = path.startsWith('/super-admin');
    const recruiterRoute = path.startsWith('/recruiter');
    const isProtectedRoute = recruiterRoute || superAdminRoute;
    
    // Check if on login pages - we should try to auto-login here too
    const isSuperAdminLoginPage = path.includes('/super-admin/login') || path.includes('/super-admin/forgot-password');
    const isRecruiterLoginPage = path.includes('/recruiter/login') || path.includes('/recruiter/forgot-password') || path.includes('/recruiter/signup');
    const isLoginPage = isSuperAdminLoginPage || isRecruiterLoginPage;

    // Determine context/role for refresh routing (axios interceptor)
    // - If route explicitly indicates super-admin/recruiter: use that.
    // - Otherwise (e.g. on '/'): keep last known role from sessionStorage.
    const storedRole = getUserRole();
    const isSuperAdminContext = superAdminRoute || isSuperAdminLoginPage || storedRole === 'super_admin';
    setIsSuperAdmin(isSuperAdminContext);

    // Only override stored role when route makes it unambiguous.
    if (superAdminRoute || isSuperAdminLoginPage) {
      setUserRole('super_admin');
    } else if (recruiterRoute || isRecruiterLoginPage) {
      setUserRole('admin');
    }

    let cancelled = false;

    (async () => {
      // Skip bootstrap for truly public routes unless we have evidence of an existing session.
      // (Prevents redirecting anonymous visitors to /login due to a 401)
      const hasSomeSessionSignal = !!getUserRole() || !!getAccessToken();
      if (!isProtectedRoute && !isLoginPage && !hasSomeSessionSignal) {
        setIsAuthLoading(false);
        return;
      }

      try {
        // Try to fetch profile/dashboard to verify session.
        // If token is expired, interceptor will refresh on 401 and retry automatically.
        // The interceptor uses cookies (withCredentials), so even if sessionStorage is empty,
        // the refresh token cookie can still refresh the access token.
        if (!isSuperAdminContext) {
          // Recruiter flow
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
            
            // If on login page and auth succeeded, redirect to dashboard
            if (isLoginPage) {
              window.location.href = '/recruiter/dashboard';
            }
          } catch (profileError: any) {
            if (cancelled) return;
            // 401 means refresh also failed (interceptor tried) - user needs to re-login
            setIsAuthenticated(false);
            setUser(null);
            // If on login page, that's fine - user will login with credentials
          }
        } else {
          // Super admin flow
          try {
            const dashboardRes = await api.get<any>(API_ENDPOINTS.SUPER_ADMIN.DASHBOARD_COUNTS);
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
            
            // If on login page and auth succeeded, redirect to dashboard
            if (isLoginPage) {
              window.location.href = '/super-admin/dashboard';
            }
          } catch (dashboardError: any) {
            if (cancelled) return;
            setIsAuthenticated(false);
            setUser(null);
            // If on login page, that's fine - user will login with credentials
          }
        }
      } catch {
        if (cancelled) return;
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [justVerified, location.pathname]);

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

      // Mark as just verified so bootstrap effect skips and doesn't show loader
      setJustVerified(true);
      setUser(newUser);
      setIsAuthenticated(true);
      setIsAuthLoading(false);
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
