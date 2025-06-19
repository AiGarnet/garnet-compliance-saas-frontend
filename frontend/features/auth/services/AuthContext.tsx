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

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Check if we're in static generation mode
const isStaticGeneration = !isBrowser || process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    // During SSG/SSR, don't show loading state
    if (!isBrowser) return false;
    return true;
  });
  const [isClient, setIsClient] = useState(false);

  const router = useRouter();

  // Mark as client-side after hydration
  useEffect(() => {
    setIsClient(true);
    
    if (!isBrowser) return;
    
    // Check for existing auth on client side only
    const checkAuth = async () => {
      try {
        // Use consistent localStorage key
        const savedToken = localStorage.getItem('authToken');
        if (savedToken) {
          setToken(savedToken);
          
          // Use the correct API endpoint - /api/auth/profile instead of /api/auth/verify
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user || userData);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData'); // Clear any cached user data
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid auth
        if (isBrowser) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!isBrowser) return;
    
    setIsLoading(true);
    try {
      const response = await auth.login({ email, password });
      
      const token = response.access_token || response.token;
      if (token && response.user) {
        // Use consistent localStorage keys
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        setToken(token);
        setUser(response.user);
        
        // Handle redirect parameter from URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          // Default redirect based on role
          if (response.user.role === 'enterprise') {
            router.push('/trust-portal');
          } else {
            router.push('/dashboard');
          }
        }
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    if (!isBrowser) return;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
    router.push('/auth/login');
  }, [router]);

  const hasAccess = useCallback((requiredRole?: string | string[]) => {
    if (!user) return false;
    
    if (!requiredRole) return true;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  }, [user]);

  const value = useMemo(() => ({
    user,
    token,
    isLoading: !isClient ? false : isLoading, // Never show loading during SSG
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    hasAccess,
  }), [user, token, isLoading, isClient, login, logout, hasAccess]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  // During SSG/SSR, provide a safe fallback
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
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 
