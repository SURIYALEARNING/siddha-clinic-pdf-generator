import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOtpAndResetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ message: string }>;
  verifyRegistrationOtp: (name: string, email: string, password: string, otp: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('lhcc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.getMe().then((res) => {
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        localStorage.removeItem('lhcc_token');
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string, _remember: boolean) => {
    setError(null);
    const res = await api.login(email, password);
    if (res.error) {
      setError(res.error);
      throw new Error(res.error);
    }
    if (res.data) {
      localStorage.setItem('lhcc_token', res.data.token);
      setUser(res.data.user);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    localStorage.removeItem('lhcc_token');
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setError(null);
    const res = await api.forgotPassword(email);
    if (res.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }, []);

  const verifyOtpAndResetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    setError(null);
    const res = await api.resetPassword(email, otp, newPassword);
    if (res.error) {
      setError(res.error);
      throw new Error(res.error);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    const res = await api.register(name, email, password);
    if (res.error) {
      setError(res.error);
      throw new Error(res.error);
    }
    return { message: res.data?.message || 'OTP sent to admin email' };
  }, []);

  const verifyRegistrationOtp = useCallback(async (name: string, email: string, password: string, otp: string) => {
    setError(null);
    const res = await api.verifyRegistrationOtp(name, email, password, otp);
    if (res.error) {
      setError(res.error);
      throw new Error(res.error);
    }
    if (res.data) {
      localStorage.setItem('lhcc_token', res.data.token);
      setUser(res.data.user);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        forgotPassword,
        verifyOtpAndResetPassword,
        register,
        verifyRegistrationOtp,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
