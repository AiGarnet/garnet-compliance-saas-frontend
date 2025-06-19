"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

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

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // During SSR/SSG, provide a safe fallback
  if (!isBrowser && !context) {
    return {
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      login: async () => {},
      logout: () => {},
      hasAccess: () => false,
    };
  }
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to set cookie (only in browser)
const setCookie = (name: string, value: string, days: number = 7) => {
  if (!isBrowser) return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Helper function to remove cookie (only in browser)
const removeCookie = (name: string) => {
  if (!isBrowser) return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    // During SSR, don't show loading state
    if (!isBrowser) return false;
    return true;
  });
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Initialize auth state from localStorage (client-side only)
  useEffect(() => {
    setIsClient(true);
    
    if (!isBrowser) return;
    
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('userData');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setCookie('authToken', storedToken);
          
          // Verify token is still valid by calling profile endpoint
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              }
            });
            
            if (!response.ok) {
              // Token is invalid, clear everything
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              removeCookie('authToken');
              setToken(null);
              setUser(null);
            } else {
              const userData = await response.json();
              setUser(userData.user || userData);
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            // Clear invalid data on validation error
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            removeCookie('authToken');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        removeCookie('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isBrowser) return;
    
    try {
      const data = await auth.login({ email, password });

      // The backend returns 'access_token', not 'token'
      const token = data.access_token || data.token; // Support both for compatibility
      
      // Store auth data in both localStorage and cookies
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      setCookie('authToken', token);
      
      setToken(token);
      setUser(data.user);

      // Check for redirect parameter
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
    } catch (error) {
      throw error;
    }
  };

  const logout = useCallback(() => {
    if (!isBrowser) return;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
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
    isLoading: !isClient ? false : isLoading, // Never show loading during SSR
    isAuthenticated,
    login,
    logout,
    hasAccess,
  }), [user, token, isLoading, isClient, isAuthenticated, logout, hasAccess]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
