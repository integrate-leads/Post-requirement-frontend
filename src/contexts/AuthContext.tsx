import React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_ENDPOINTS, TOKEN_REFRESH_INTERVAL, api } from '@/hooks/useApi';

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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingSignup, setPendingSignup] = useState<SignupData | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check if pending email is super admin
  const checkIsSuperAdmin = (email: string) => {
    return email.toLowerCase() === SUPER_ADMIN_EMAIL;
  };

  // Get appropriate API endpoints based on user type
  const getEndpoints = useCallback((email?: string) => {
    const emailToCheck = email || pendingEmail || '';
    return checkIsSuperAdmin(emailToCheck) 
      ? API_ENDPOINTS.SUPER_ADMIN 
      : API_ENDPOINTS.RECRUITER;
  }, [pendingEmail]);

  // Token refresh logic
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        const endpoints = getEndpoints(user.email);
        await api.get(endpoints.REFRESH_TOKEN);
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    };

    // Set up refresh interval (14 minutes)
    const interval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [user, getEndpoints]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const endpoints = getEndpoints(email);
    setIsSuperAdmin(checkIsSuperAdmin(email));
    
    try {
      await api.post(endpoints.LOGIN, { email, password });
      setPendingEmail(email.toLowerCase());
      setPendingSignup(null);
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return { success: false, error: axiosError.response?.data?.message || 'Login failed' };
    }
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    // For now, signup goes to recruiter endpoints
    // Store signup data and send OTP
    setPendingSignup(data);
    setPendingEmail(data.email.toLowerCase());
    setIsSuperAdmin(false);
    
    // TODO: Call actual signup API when available
    return { success: true };
  };

  const verifyOtp = async (otp: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingEmail) {
      return { success: false, error: 'No pending email found' };
    }

    const endpoints = getEndpoints();
    
    try {
      const response = await api.post<{ 
        accessToken?: string; 
        refreshToken?: string;
        user?: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
        };
      }>(endpoints.VERIFY_OTP, { email: pendingEmail, otp });

      let newUser: User;
      
      if (pendingSignup) {
        // New signup
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
        // Existing login
        newUser = {
          id: response.data?.user?.id || Math.random().toString(36).substr(2, 9),
          email: pendingEmail,
          name: response.data?.user?.name || (isSuperAdmin ? 'Super Admin' : 'User'),
          role: response.data?.user?.role || (isSuperAdmin ? 'super_admin' : 'recruiter'),
          approvedServices: [],
        };
      }
      
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
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
    const endpoints = getEndpoints(email);
    setPendingEmail(email.toLowerCase());
    setIsSuperAdmin(checkIsSuperAdmin(email));
    
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
        confirmPassword 
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
    
    setUser(null);
    setPendingEmail(null);
    setPendingSignup(null);
    setIsSuperAdmin(false);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
