'use client';

import { TrustPortalPublicView } from '@/components/trust-portal/TrustPortalPublicView';
import { TrustPortalVendorView } from '@/components/trust-portal/TrustPortalVendorView';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function TrustPortalPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trust portal...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and is a vendor, show vendor view
  if (isAuthenticated && user?.role === 'vendor') {
    return <TrustPortalVendorView />;
  }

  // If there's a token, show public view with token
  if (token) {
    return <TrustPortalPublicView token={token} />;
  }

  // No token and not authenticated vendor - show access denied
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Access</h1>
        <p className="text-gray-600 mb-4">No invite token provided.</p>
        <p className="text-sm text-gray-500">
          Please use a valid invite link to access this trust portal or sign in as a vendor.
        </p>
      </div>
    </div>
  );
} 