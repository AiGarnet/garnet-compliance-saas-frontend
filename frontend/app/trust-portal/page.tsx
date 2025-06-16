'use client';

import { TrustPortalPublicView } from '@/components/trust-portal/TrustPortalPublicView';
import { TrustPortalVendorView } from '@/components/trust-portal/TrustPortalVendorView';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function TrustPortalPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const { user, isAuthenticated, isLoading } = useAuth();

  // Debug logging
  console.log('Trust Portal Debug:', {
    user,
    isAuthenticated,
    isLoading,
    token,
    userRole: user?.role
  });

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
    console.log('Showing vendor view for user:', user);
    return <TrustPortalVendorView />;
  }

  // If there's a token, show public view with token
  if (token) {
    console.log('Showing public view with token:', token);
    return <TrustPortalPublicView token={token} />;
  }

  // No token and not authenticated vendor - show access denied or enterprise view
  if (isAuthenticated && user?.role === 'enterprise') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Enterprise Trust Portal</h1>
          <p className="text-gray-600 mb-4">
            Welcome! As an enterprise user, you can access vendor trust portals through invite links.
          </p>
          <p className="text-sm text-gray-500">
            Contact vendors directly to request access to their trust portals.
          </p>
        </div>
      </div>
    );
  }

  // Show different message based on authentication status
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Trust Portal Access</h1>
        {isAuthenticated ? (
          <>
            <p className="text-gray-600 mb-4">
              You are logged in as: <strong>{user?.role || 'Unknown'}</strong>
            </p>
            <p className="text-sm text-gray-500">
              {user?.role === 'vendor' 
                ? 'Vendors should see their trust portal here. If you\'re seeing this message, please contact support.'
                : 'To access a vendor\'s trust portal, you need a valid invite link from the vendor.'
              }
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-4">Please sign in to access the trust portal.</p>
            <a 
              href="/auth/login" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
          </>
        )}
      </div>
    </div>
  );
} 