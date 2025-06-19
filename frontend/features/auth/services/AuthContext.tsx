"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from './api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasAccess: (requiredRole?: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to check if we're in browser environment
const isBrowser = () => typeof window !== 'undefined';

// Helper function to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  if (!isBrowser()) return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Helper function to remove cookie
const removeCookie = (name: string) => {
  if (!isBrowser()) return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Helper function to safely access localStorage
const getLocalStorageItem = (key: string): string | null => {
  if (!isBrowser()) return null;
  
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error accessing localStorage for key ${key}:`, error);
    return null;
  }
};

// Helper function to safely set localStorage
const setLocalStorageItem = (key: string, value: string): void => {
  if (!isBrowser()) return;
  
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting localStorage for key ${key}:`, error);
  }
};

// Helper function to safely remove localStorage
const removeLocalStorageItem = (key: string): void => {
  if (!isBrowser()) return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage for key ${key}:`, error);
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = getLocalStorageItem('authToken');
        const storedUser = getLocalStorageItem('userData');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Also set cookie for middleware access
          setCookie('authToken', storedToken);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        removeLocalStorageItem('authToken');
        removeLocalStorageItem('userData');
        removeCookie('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize auth in browser environment
    if (isBrowser()) {
      initializeAuth();
    } else {
      // In SSR environment, just set loading to false
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await auth.login({ email, password });

      // The backend returns 'access_token', not 'token'
      const token = data.access_token || data.token; // Support both for compatibility
      
      if (!token) {
        throw new Error('No authentication token received from server');
      }
      
      // Store auth data in both localStorage and cookies
      setLocalStorageItem('authToken', token);
      setLocalStorageItem('userData', JSON.stringify(data.user));
      setCookie('authToken', token);
      
      setToken(token);
      setUser(data.user);

      // Check for redirect parameter (only in browser)
      if (isBrowser()) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          // Default redirect based on role
          if (data.user.role === 'enterprise') {
            router.push('/trust-portal');
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = useCallback(() => {
    removeLocalStorageItem('authToken');
    removeLocalStorageItem('userData');
    removeCookie('authToken');
    setToken(null);
    setUser(null);
    router.push('/auth/login');
  }, [router]);

  // Memoize the hasAccess function to prevent re-renders
  const hasAccess = useCallback((requiredRole?: string | string[]) => {
    if (!user) return false;

    // If no specific role required, just check if authenticated
    if (!requiredRole) return true;

    // Handle array of roles
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }

    // Handle single role
    return user.role === requiredRole;
  }, [user]);

  const isAuthenticated = useMemo(() => !!user && !!token, [user, token]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasAccess,
  }), [user, token, isLoading, isAuthenticated, logout, hasAccess]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
