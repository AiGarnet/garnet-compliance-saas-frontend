'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import TrustPortalClient from './TrustPortalClient';

function InvitePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  if (!token) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h1>
          <p className="text-gray-600">No invitation token provided.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vendor Trust Portal
          </h1>
          <p className="text-gray-600">
            Compliance and security information shared by invitation
          </p>
        </div>

        <TrustPortalClient token={token} />
      </div>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <InvitePageContent />
    </Suspense>
  );
} 