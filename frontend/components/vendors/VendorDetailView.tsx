"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { vendors as vendorAPI } from "@/lib/api";
import { useVendor } from "@/hooks/useVendor";
import { VendorDetailHeader } from "./VendorDetailHeader";
import { VendorInfoCard } from "./VendorInfoCard";
import { QuestionnaireStatus } from "./QuestionnaireStatus";
import { VendorQuestionnaireAnswers } from "./VendorQuestionnaireAnswers";
import { VendorEvidenceSection } from "./VendorEvidenceSection";
import { VendorActivityFeed } from "./VendorActivityFeed";
import { EditVendorModal } from "./EditVendorModal";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";

interface VendorDetailViewProps {
  vendorId: string;
}

export function VendorDetailView({ vendorId }: VendorDetailViewProps) {
  // Protect this page - redirect to login if not authenticated
  const { isLoading: authLoading } = useAuthGuard();
  
  const { vendor, isLoading, error, fetchVendor } = useVendor(vendorId);
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportingAnswers, setIsImportingAnswers] = useState(false);

  // Check if edit mode is requested via URL parameter (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const editParam = urlParams.get('edit');
      if (editParam === 'true' && vendor) {
        setIsEditModalOpen(true);
        // Remove the edit parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('edit');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [vendor]);

  const handleUpdateVendor = async (updatedVendor: any) => {
    try {
      console.log('Updating vendor with data:', updatedVendor);
      
      await vendorAPI.update(vendor!.id, updatedVendor);
      console.log('Vendor updated successfully');
      
      // Refresh vendor data
      await fetchVendor();
      console.log('Vendor data refreshed');
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update vendor:', error);
      throw error;
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Vendor</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchVendor()}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor Not Found</h1>
          <p className="text-gray-600 mb-4">The vendor you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/vendors"
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 inline-block"
          >
            Back to Vendors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <VendorDetailHeader 
          vendor={vendor} 
          onEdit={() => setIsEditModalOpen(true)}
        />

        {/* Main Content */}
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <QuestionnaireStatus vendor={vendor} />
              <VendorQuestionnaireAnswers vendor={vendor} />
              <VendorEvidenceSection vendor={vendor} />
              <VendorActivityFeed vendor={vendor} />
            </div>
            
            {/* Right column */}
            <div className="space-y-6">
              <VendorInfoCard vendor={vendor} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Vendor Modal */}
      {vendor && (
        <EditVendorModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateVendor}
          vendor={vendor}
        />
      )}
    </>
  );
} 