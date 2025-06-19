"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import of useAuth to prevent SSR issues
const useAuthDynamic = () => {
  if (typeof window === 'undefined') {
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
  
  // Dynamic import only on client side
  const { useAuth } = require('@/lib/auth/AuthContext');
  return useAuth();
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallback?: React.ReactNode;
}

function ProtectedRouteComponent({ 
  children, 
  requiredRole,
  fallback = (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [redirected, setRedirected] = useState(false);

  // Mark client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get auth state dynamically
  const { user, token, isLoading, isAuthenticated, hasAccess } = useAuthDynamic();

  useEffect(() => {
    // Only handle redirects on client side and prevent multiple redirects
    if (!isClient || isLoading || redirected) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      setRedirected(true);
      router.replace(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // If authenticated but doesn't have required role access
    if (requiredRole && !hasAccess(requiredRole)) {
      setRedirected(true);
      // Redirect based on user role
      if (user?.role === 'enterprise') {
        router.replace('/trust-portal');
      } else {
        router.replace('/dashboard');
      }
      return;
    }
  }, [isClient, isLoading, isAuthenticated, requiredRole, user?.role, hasAccess, router, redirected]);

  // Show loading during SSR/initial load or when auth is loading
  if (!isClient || isLoading) {
    return <>{fallback}</>;
  }

  // If redirected, show loading to prevent flash
  if (redirected) {
    return <>{fallback}</>;
  }

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // If role required and user doesn't have access, don't render children
  if (requiredRole && !hasAccess(requiredRole)) {
    return <>{fallback}</>;
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Export with dynamic loading to prevent SSR issues
const ProtectedRoute = dynamic(() => Promise.resolve(ProtectedRouteComponent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  ),
});

export default ProtectedRoute; 
