import React from 'react';
import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'super_admin' | 'recruiter';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  approvedServices: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
  pendingEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'superadmin@integrateleads.com';

const MOCK_USERS: Record<string, { password: string; name: string; company?: string }> = {
  'superadmin@integrateleads.com': { password: 'admin123', name: 'Super Admin' },
  'recruiter@company.com': { password: 'recruiter123', name: 'John Doe', company: 'Tech Corp' },
  'hr@startup.com': { password: 'hr123', name: 'Jane Smith', company: 'StartUp Inc' },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setPendingEmail(email.toLowerCase());
      return true;
    }
    return false;
  };

  const verifyOtp = async (otp: string): Promise<boolean> => {
    if (otp === '123456' && pendingEmail) {
      const mockUser = MOCK_USERS[pendingEmail];
      const role: UserRole = pendingEmail === SUPER_ADMIN_EMAIL ? 'super_admin' : 'recruiter';
      const newUser: User = { id: Math.random().toString(36).substr(2, 9), email: pendingEmail, name: mockUser.name, role, company: mockUser.company, approvedServices: [] };
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      setPendingEmail(null);
      return true;
    }
    return false;
  };

  const logout = () => { setUser(null); setPendingEmail(null); localStorage.removeItem('auth_user'); };

  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, verifyOtp, logout, pendingEmail }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};