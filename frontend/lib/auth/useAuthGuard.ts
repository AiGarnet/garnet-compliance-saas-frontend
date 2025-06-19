import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

export function useAuthGuard(requiredRole?: string | string[]) {
  const { user, isAuthenticated, isLoading, hasAccess } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only check after loading is complete and we're on client side
    if (!isClient || isLoading) return;

    // Only perform auth checks on client side
    if (typeof window === 'undefined') return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (requiredRole && !hasAccess(requiredRole)) {
      // Redirect based on user role if they don't have access
      if (user?.role === 'enterprise') {
        router.push('/trust-portal');
      } else {
        router.push('/dashboard');
      }
      return;
    }
  }, [isClient, isLoading, isAuthenticated, requiredRole, router, user?.role, hasAccess]);

  return {
    isLoading: !isClient ? false : isLoading, // Never show loading during SSR
    isAuthenticated: !isClient ? false : isAuthenticated,
    user: !isClient ? null : user,
    hasAccess: !isClient ? () => false : hasAccess
  };
} 
