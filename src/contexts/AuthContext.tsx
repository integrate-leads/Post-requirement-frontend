import React from 'react';
import { createContext, useContext, useState, ReactNode } from 'react';

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
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
  pendingEmail: string | null;
  pendingSignup: SignupData | null;
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

const MOCK_USERS: Record<string, { password: string; name: string; company?: string; role: UserRole }> = {
  'superadmin@integrateleads.com': { password: 'admin123', name: 'Super Admin', role: 'super_admin' },
  'recruiter@company.com': { password: 'recruiter123', name: 'John Doe', company: 'Tech Corp', role: 'recruiter' },
  'hr@startup.com': { password: 'hr123', name: 'Jane Smith', company: 'StartUp Inc', role: 'recruiter' },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingSignup, setPendingSignup] = useState<SignupData | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setPendingEmail(email.toLowerCase());
      setPendingSignup(null);
      return true;
    }
    return false;
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    // Check if user already exists
    if (MOCK_USERS[data.email.toLowerCase()]) {
      return false;
    }
    // Store signup data and send OTP
    setPendingSignup(data);
    setPendingEmail(data.email.toLowerCase());
    // Add to mock users
    MOCK_USERS[data.email.toLowerCase()] = {
      password: data.password,
      name: data.fullName,
      company: data.company,
      role: data.userType,
    };
    return true;
  };

  const verifyOtp = async (otp: string): Promise<boolean> => {
    if (otp === '123456' && pendingEmail) {
      let newUser: User;
      
      if (pendingSignup) {
        // New signup
        newUser = {
          id: Math.random().toString(36).substr(2, 9),
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
        const mockUser = MOCK_USERS[pendingEmail];
        newUser = {
          id: Math.random().toString(36).substr(2, 9),
          email: pendingEmail,
          name: mockUser.name,
          role: mockUser.role,
          company: mockUser.company,
          approvedServices: [],
        };
      }
      
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      setPendingEmail(null);
      setPendingSignup(null);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setPendingEmail(null);
    setPendingSignup(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      signup,
      verifyOtp,
      logout,
      pendingEmail,
      pendingSignup,
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
