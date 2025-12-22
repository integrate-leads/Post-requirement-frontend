import React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_ENDPOINTS, setCookie, getCookie, deleteCookie, apiRequest, TOKEN_REFRESH_INTERVAL } from '@/hooks/useApi';

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
      const endpoints = getEndpoints(user.email);
      const result = await apiRequest<{ accessToken: string }>(endpoints.REFRESH_TOKEN, {
        method: 'GET',
      });
      
      if (result.data?.accessToken) {
        setCookie('access_token', result.data.accessToken, 15);
      }
    };

    // Initial refresh check
    const accessToken = getCookie('access_token');
    if (!accessToken) {
      refreshToken();
    }

    // Set up refresh interval (14 minutes)
    const interval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [user, getEndpoints]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const endpoints = getEndpoints(email);
    setIsSuperAdmin(checkIsSuperAdmin(email));
    
    const result = await apiRequest<{ message: string }>(endpoints.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    setPendingEmail(email.toLowerCase());
    setPendingSignup(null);
    return { success: true };
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
    
    const result = await apiRequest<{ 
      accessToken: string; 
      refreshToken: string;
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
      };
    }>(endpoints.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify({ email: pendingEmail, otp }),
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data?.accessToken) {
      // Store tokens in cookies
      setCookie('access_token', result.data.accessToken, 15);
      if (result.data.refreshToken) {
        setCookie('refresh_token', result.data.refreshToken, 60 * 24 * 7); // 7 days
      }
    }

    let newUser: User;
    
    if (pendingSignup) {
      // New signup
      newUser = {
        id: result.data?.user?.id || Math.random().toString(36).substr(2, 9),
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
        id: result.data?.user?.id || Math.random().toString(36).substr(2, 9),
        email: pendingEmail,
        name: result.data?.user?.name || (isSuperAdmin ? 'Super Admin' : 'User'),
        role: result.data?.user?.role || (isSuperAdmin ? 'super_admin' : 'recruiter'),
        approvedServices: [],
      };
    }
    
    setUser(newUser);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setPendingEmail(null);
    setPendingSignup(null);
    return { success: true };
  };

  const resendOtp = async (): Promise<{ success: boolean; error?: string }> => {
    if (!pendingEmail) {
      return { success: false, error: 'No pending email found' };
    }

    const endpoints = getEndpoints();
    
    const result = await apiRequest<{ message: string }>(endpoints.RESEND_OTP, {
      method: 'POST',
      body: JSON.stringify({ email: pendingEmail }),
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const endpoints = getEndpoints(email);
    setPendingEmail(email.toLowerCase());
    setIsSuperAdmin(checkIsSuperAdmin(email));
    
    const result = await apiRequest<{ message: string }>(endpoints.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
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
    
    const result = await apiRequest<{ message: string }>(endpoints.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ 
        email: pendingEmail, 
        otp, 
        password, 
        confirmPassword 
      }),
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    setPendingEmail(null);
    return { success: true };
  };

  const logout = async () => {
    if (user) {
      const endpoints = getEndpoints(user.email);
      await apiRequest(endpoints.LOGOUT, { method: 'POST' });
    }
    
    setUser(null);
    setPendingEmail(null);
    setPendingSignup(null);
    setIsSuperAdmin(false);
    deleteCookie('access_token');
    deleteCookie('refresh_token');
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
