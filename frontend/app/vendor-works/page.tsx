'use client';

import { VendorWorksView } from '@/components/vendors/VendorWorksView';
import { useSearchParams } from 'next/navigation';

export default function VendorWorksPage() {
  const searchParams = useSearchParams();
  const vendorId = searchParams?.get('id');

  if (!vendorId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Access</h1>
          <p className="text-gray-600 mb-4">No vendor ID provided.</p>
          <p className="text-sm text-gray-500">
            Please access this page from a valid vendor profile.
          </p>
        </div>
      </div>
    );
  }

  return <VendorWorksView vendorId={vendorId} />;
} 