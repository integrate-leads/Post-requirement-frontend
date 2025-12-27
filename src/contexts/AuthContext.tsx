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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: () => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
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

const SUPER_ADMIN_EMAIL = 'superadmin@integrateleads.com';

// NOTE: token/refreshToken cookies are typically HttpOnly, so we cannot reliably
// read them with document.cookie. Auth state is maintained in-memory and updated
// by successful auth API calls.

const setNonHttpOnlyCookie = (name: string, value: string) => {
  // Note: If backend sets HttpOnly cookies, this won't override them.
  // This is only a fallback for backends that return tokens in the response body.
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${secure}`;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingSignup, setPendingSignup] = useState<SignupData | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkIsSuperAdmin = (email: string) => email.toLowerCase() === SUPER_ADMIN_EMAIL;

  const getEndpoints = useCallback((email?: string) => {
    const emailToCheck = email || pendingEmail || '';
    return checkIsSuperAdmin(emailToCheck) ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
  }, [pendingEmail]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const isSuperAdminUser = checkIsSuperAdmin(email);
    const endpoints = isSuperAdminUser ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
    setIsSuperAdmin(isSuperAdminUser);

    // Set user role for axios interceptor (refresh endpoint routing)
    setUserRole(isSuperAdminUser ? 'super_admin' : 'admin');

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

      // Store tokens in memory for axios interceptor AND set non-HttpOnly cookies as fallback
      if (response.data?.accessToken) {
        setAccessToken(response.data.accessToken);
        setNonHttpOnlyCookie('token', response.data.accessToken);
      }
      if (response.data?.refreshToken) {
        setRefreshToken(response.data.refreshToken);
        setNonHttpOnlyCookie('refreshToken', response.data.refreshToken);
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

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const isSuperAdminUser = checkIsSuperAdmin(email);
    const endpoints = isSuperAdminUser ? API_ENDPOINTS.SUPER_ADMIN : API_ENDPOINTS.ADMIN;
    setPendingEmail(email.toLowerCase());
    setIsSuperAdmin(isSuperAdminUser);
    setUserRole(isSuperAdminUser ? 'super_admin' : 'admin');

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
        const endpoints = getEndpoints(user.email);
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

