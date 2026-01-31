import React from 'react';
import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { API_ENDPOINTS, api } from '@/hooks/useApi';
import { getUserRole, getAccessToken, setUserRole, setAccessToken, setRefreshToken, hasLogoutFlag, setLogoutFlag, clearLogoutFlag } from '@/lib/axios';

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
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingSignup, setPendingSignup] = useState<SignupData | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // Track if user just verified OTP to skip bootstrap check
  const [justVerified, setJustVerified] = useState(false);
  // Track previous pathname to detect navigation vs refresh
  const prevPathnameRef = useRef<string | null>(null);
  // Track if this is the initial mount
  const isInitialMountRef = useRef<boolean>(true);

  // Get endpoints based on isSuperAdmin state (determined by route, not email)
  const getEndpoints = useCallback(() => {
    return isSuperAdmin ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
  }, [isSuperAdmin]);

  // Bootstrap auth on mount and route changes:
  // - For protected routes: verify session (no auto-login screen)
  // - For login pages: only auto-login if navigating to login page (not on refresh) and no logout flag
  // - Auto-login shows loading screen for 2-3 seconds, then attempts login with notification
  React.useEffect(() => {
    // Skip bootstrap if user just verified OTP
    if (justVerified) {
      setIsAuthLoading(false);
      isInitialMountRef.current = false;
      prevPathnameRef.current = location.pathname;
      return;
    }

    const path = location.pathname;
    const superAdminRoute = path.startsWith('/super-admin');
    const recruiterRoute = path.startsWith('/recruiter');
    const isProtectedRoute = recruiterRoute || superAdminRoute;
    
    // Check if on login pages
    const isSuperAdminLoginPage = path.includes('/super-admin/login') || path.includes('/super-admin/forgot-password');
    const isRecruiterLoginPage = path.includes('/recruiter/login') || path.includes('/recruiter/forgot-password') || path.includes('/recruiter/signup');
    const isLoginPage = isSuperAdminLoginPage || isRecruiterLoginPage;

    // Determine context/role for refresh routing (axios interceptor)
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
      // For protected routes and public routes with session: verify session
      const hasSomeSessionSignal = !!getUserRole() || !!getAccessToken();
      const isPublicRoute = !isProtectedRoute && !isLoginPage;
      
      if (isProtectedRoute && !isLoginPage) {
        // Protected route - verify session
        if (!hasSomeSessionSignal) {
          setIsAuthLoading(false);
          isInitialMountRef.current = false;
          prevPathnameRef.current = location.pathname;
          return;
        }

        try {
          if (!isSuperAdminContext) {
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
              if (cancelled) return;
              setIsAuthenticated(false);
              setUser(null);
            }
          } else {
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
            } catch (dashboardError: any) {
              if (cancelled) return;
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } catch {
          if (cancelled) return;
          setIsAuthenticated(false);
          setUser(null);
        } finally {
          if (!cancelled) {
            setIsAuthLoading(false);
            isInitialMountRef.current = false;
            prevPathnameRef.current = location.pathname;
          }
        }
        return;
      } else if (isPublicRoute && hasSomeSessionSignal) {
        // Public route but has session - verify to maintain auth state
        try {
          // Determine which API to use based on stored role
          const storedRole = getUserRole();
          const shouldUseSuperAdmin = storedRole === 'super_admin';
          
          if (!shouldUseSuperAdmin) {
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
              if (cancelled) return;
              // Silent fail - user might not be logged in, just clear state
              setIsAuthenticated(false);
              setUser(null);
            }
          } else {
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
            } catch (dashboardError: any) {
              if (cancelled) return;
              // Silent fail - user might not be logged in, just clear state
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } catch {
          if (cancelled) return;
          setIsAuthenticated(false);
          setUser(null);
        } finally {
          if (!cancelled) {
            setIsAuthLoading(false);
            isInitialMountRef.current = false;
            prevPathnameRef.current = location.pathname;
          }
        }
        return;
      } else if (isPublicRoute && !hasSomeSessionSignal) {
        // Public route, no session - just finish loading
        setIsAuthLoading(false);
        isInitialMountRef.current = false;
        prevPathnameRef.current = location.pathname;
        return;
      }

      // For login pages ONLY: only auto-login if:
      // 1. Not on initial mount (user navigated to login page)
      // 2. Previous path was not a login page (user navigated from another page)
      // 3. No logout flag is set
      // 4. Has some session signal (token or role)
      if (isLoginPage) {
        const isNavigatingToLogin = !isInitialMountRef.current && 
                                     prevPathnameRef.current !== null && 
                                     !prevPathnameRef.current.includes('/login') && 
                                     !prevPathnameRef.current.includes('/forgot-password') &&
                                     !prevPathnameRef.current.includes('/signup');
        const shouldAutoLogin = isNavigatingToLogin && 
                                !hasLogoutFlag() && 
                                (!!getUserRole() || !!getAccessToken());

        if (shouldAutoLogin) {
          // Show login screen for 1-2 seconds, then trigger auto-login
          setIsAuthLoading(false); // Allow login screen to render
          
          // Show notification that auto-login is being attempted
          notifications.show({
            title: 'Auto-login',
            message: 'Attempting to sign you in...',
            color: 'blue',
            autoClose: 2000,
          });
        
        // Wait 1.5 seconds before attempting auto-login (showing login screen during this time)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (cancelled) return;

        try {
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
              
              // Show success notification
              notifications.show({
                title: 'Auto-login successful',
                message: 'Welcome back!',
                color: 'green',
                autoClose: 3000,
              });
              
              // Wait a bit for notification to be visible, then redirect
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Redirect to dashboard
              window.location.href = '/recruiter/dashboard';
            } catch (profileError: any) {
              if (cancelled) return;
              setIsAuthenticated(false);
              setUser(null);
              
              // Show error notification
              notifications.show({
                title: 'Auto-login failed',
                message: 'Please login with your credentials',
                color: 'red',
                autoClose: 4000,
              });
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
              
              // Show success notification
              notifications.show({
                title: 'Auto-login successful',
                message: 'Welcome back!',
                color: 'green',
                autoClose: 3000,
              });
              
              // Wait a bit for notification to be visible, then redirect
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Redirect to dashboard
              window.location.href = '/super-admin/dashboard';
            } catch (dashboardError: any) {
              if (cancelled) return;
              setIsAuthenticated(false);
              setUser(null);
              
              // Show error notification
              notifications.show({
                title: 'Auto-login failed',
                message: 'Please login with your credentials',
                color: 'red',
                autoClose: 4000,
              });
            }
          }
        } catch {
          if (cancelled) return;
          setIsAuthenticated(false);
          setUser(null);
          
          // Show error notification
          notifications.show({
            title: 'Auto-login failed',
            message: 'Please login with your credentials',
            color: 'red',
            autoClose: 4000,
          });
        }
        } else {
          // On login page but not auto-login scenario - just finish loading
          setIsAuthLoading(false);
        }
      } else {
        // Not on login page - just finish loading
        setIsAuthLoading(false);
      }

      isInitialMountRef.current = false;
      prevPathnameRef.current = location.pathname;
    })();

    return () => {
      cancelled = true;
    };
  }, [justVerified, location.pathname]);

  const login = async (email: string, password: string, isSuperAdminRoute = false): Promise<{ success: boolean; error?: string }> => {
    // Determine API based on route, not email
    const endpoints = isSuperAdminRoute ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
    setIsSuperAdmin(isSuperAdminRoute);
    // Clear logout flag when user attempts new login
    clearLogoutFlag();

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
      // Clear logout flag on successful login
      clearLogoutFlag();
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
    // Set logout flag FIRST to prevent auto-login after logout
    setLogoutFlag();
    
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
