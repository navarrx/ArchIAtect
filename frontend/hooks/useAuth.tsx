"use client"

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Get user data
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`);
      const userData = response.data;

      // Store user data
      localStorage.setItem('userData', JSON.stringify(userData));

      setState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, user } = response.data;

      // Store token and user data
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('userData', JSON.stringify(user));

      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Update state immediately
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google/login`);
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    delete axios.defaults.headers.common['Authorization'];
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    ...state,
    login,
    loginWithGoogle,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 