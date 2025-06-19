"use client";

import { useAuth } from '@/features/auth/services/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = '/auth/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAccess } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Ensure this only runs on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle authentication redirects on client side
  useEffect(() => {
    if (!isClient || isLoading) return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = `${fallbackPath}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    if (requiredRole && !hasAccess(requiredRole)) {
      router.push('/dashboard'); // Redirect to dashboard if no access
      return;
    }
  }, [isAuthenticated, isLoading, hasAccess, requiredRole, router, fallbackPath, isClient]);

  // Show loading state during SSR and while checking auth
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Loading...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your authentication.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render children until we've verified auth on client side
  if (!isAuthenticated) {
    return null; // Router.push will handle redirect
  }

  if (requiredRole && !hasAccess(requiredRole)) {
    return null; // Router.push will handle redirect
  }

  return <>{children}</>;
}

// Higher-order component for easier usage
export const withAuth = (
  WrappedComponent: React.ComponentType<any>,
  requiredRole?: string | string[]
) => {
  return function AuthenticatedComponent(props: any) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}; 
