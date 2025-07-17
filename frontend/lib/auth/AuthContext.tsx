"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../api';
import { getDefaultRoute, UserRole } from './roles';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization?: string;
  organization_id?: string; // New field for organization linking
  created_at: string;
}

interface Subscription {
  id: string;
  status: 'active' | 'inactive' | 'past_due' | 'canceled';
  planId: string;
  planName: string;
  customerId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasAccess: (requiredRole?: string | string[]) => boolean;
  refreshSubscription: () => Promise<void>;
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

// Helper function to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Helper function to remove cookie
const removeCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('userData');

        console.log('🔍 Initializing Auth Context:', {
          hasStoredToken: !!storedToken,
          hasStoredUser: !!storedUser,
          tokenPreview: storedToken ? `${storedToken.substring(0, 20)}...` : 'none'
        });

        if (storedToken && storedUser) {
          // Validate JWT token
          try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            const now = Date.now() / 1000;
            
            if (payload.exp <= now) {
              console.error('🔒 Stored token is expired, clearing auth data');
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              removeCookie('authToken');
              return;
            }
            
            console.log('✅ Valid token found, setting user state');
            setToken(storedToken);
            const userData = JSON.parse(storedUser);
            setUser(userData);
            // Also set cookie for middleware access
            setCookie('authToken', storedToken);
            
            console.log('👤 User authenticated:', {
              userId: userData.id,
              email: userData.email,
              role: userData.role,
              organizationId: userData.organization_id,
              organization: userData.organization
            });
          } catch (tokenError) {
            console.error('🔒 Invalid JWT token format:', tokenError);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            removeCookie('authToken');
          }
        } else {
          console.log('📝 No stored authentication found');
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
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
    try {
      console.log('🔑 Attempting login for:', email);
      const data = await auth.login({ email, password });

      console.log('✅ Login successful, processing response:', {
        hasAccessToken: !!data.access_token,
        hasToken: !!data.token,
        hasUser: !!data.user,
        userEmail: data.user?.email,
        userRole: data.user?.role,
        organizationId: data.user?.organization_id,
        organization: data.user?.organization
      });

      // The backend returns 'access_token', not 'token'
      const token = data.access_token || data.token; // Support both for compatibility
      
      if (!token) {
        throw new Error('No authentication token received from server');
      }
      
      if (!data.user) {
        throw new Error('No user data received from server');
      }
      
      // Store auth data in both localStorage and cookies
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      setCookie('authToken', token);
      
      setToken(token);
      setUser(data.user);

      console.log('💾 Authentication data stored successfully');

      // Check for redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect');
      
      if (redirectTo) {
        console.log('↩️ Redirecting to:', redirectTo);
        router.push(redirectTo);
      } else {
        // Default redirect based on role
        const defaultRoute = getDefaultRoute(data.user.role);
        console.log('🏠 Redirecting to default route:', defaultRoute);
        router.push(defaultRoute);
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    removeCookie('authToken');
    setToken(null);
    setUser(null);
    setSubscription(null);
    router.push('/auth/login');
  }, [router]);

  // Function to fetch user subscription
  const refreshSubscription = useCallback(async () => {
    if (!token || !user) {
      setSubscription(null);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app'}/api/billing/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
  }, [token, user]);

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
  const hasActiveSubscription = useMemo(() => 
    !!subscription && (subscription.status === 'active' || subscription.status === 'past_due'), 
    [subscription]
  );

  // Fetch subscription when user logs in
  useEffect(() => {
    if (isAuthenticated && user && token) {
      refreshSubscription();
    }
  }, [isAuthenticated, user, token, refreshSubscription]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    subscription,
    isLoading,
    isAuthenticated,
    hasActiveSubscription,
    login,
    logout,
    hasAccess,
    refreshSubscription,
  }), [user, token, subscription, isLoading, isAuthenticated, hasActiveSubscription, logout, hasAccess, refreshSubscription]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 