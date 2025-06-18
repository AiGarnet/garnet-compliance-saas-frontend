"use client";

import { useVendor } from '@/hooks/useVendor';
import { VendorDetailHeader } from '@/components/vendors/VendorDetailHeader';
import { VendorInfoCard } from '@/components/vendors/VendorInfoCard';
import { QuestionnaireStatus } from '@/components/vendors/QuestionnaireStatus';
import { VendorQuestionnaireAnswers } from '@/components/vendors/VendorQuestionnaireAnswers';
import { VendorActivityFeed } from '@/components/vendors/VendorActivityFeed';
import { VendorDetailSkeleton } from '@/components/vendors/VendorDetailSkeleton';
import { EditVendorModal } from '@/components/vendors/EditVendorModal';
import { VendorEvidenceSection } from '@/components/vendors/VendorEvidenceSection';
import { VendorRiskAssessment } from '@/components/vendors/VendorRiskAssessment';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { vendors as vendorAPI } from '@/lib/api';
import { VendorFormData } from '@/types/vendor';
import { useAuthGuard } from '@/lib/auth/useAuthGuard';

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

  // Handle importing questionnaire answers from localStorage
  const handleImportQuestionnaireAnswers = async () => {
    if (typeof window === 'undefined' || !vendor) return;
    
    try {
      setIsImportingAnswers(true);
      
      // Get questionnaires from localStorage
      const storedQuestionnaires = localStorage.getItem('user_questionnaires');
      if (!storedQuestionnaires) {
        alert('No questionnaires found in localStorage');
        return;
      }
      
      const questionnaires = JSON.parse(storedQuestionnaires);
      console.log('Found questionnaires in localStorage:', questionnaires);
      
      // Show questionnaires to user for selection
      let selectedQuestionnaire = null;
      if (questionnaires.length === 1) {
        // Auto-select if only one questionnaire
        selectedQuestionnaire = questionnaires[0];
      } else if (questionnaires.length > 1) {
        // Let user choose which questionnaire to import
        const questionnaireOptions = questionnaires.map((q: any, index: number) => 
          `${index + 1}. ${q.name} (${q.answers?.length || 0} answers)`
        ).join('\n');
        
        const selection = prompt(`Select questionnaire to import:\n${questionnaireOptions}\n\nEnter number (1-${questionnaires.length}):`);
        const selectedIndex = selection ? parseInt(selection) - 1 : -1;
        
        if (selectedIndex >= 0 && selectedIndex < questionnaires.length) {
          selectedQuestionnaire = questionnaires[selectedIndex];
        } else {
          alert('Invalid selection');
          return;
        }
      }
      
      if (!selectedQuestionnaire || !selectedQuestionnaire.answers || selectedQuestionnaire.answers.length === 0) {
        alert('No answers found in selected questionnaire');
        return;
      }
      
      // Transform answers to the format expected by the API
      const answersToSave = selectedQuestionnaire.answers.map((qa: any) => ({
        questionId: qa.questionId || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: qa.question,
        answer: qa.answer
      }));
      
      console.log('Saving answers to vendor:', answersToSave);
      
      // Save answers to the vendor via API
      await vendorAPI.answers.save(vendorId, answersToSave);
      
      alert(`Successfully imported ${answersToSave.length} questionnaire answers to ${vendor.name}!`);
      
      // Refresh vendor data to show the new answers
      fetchVendor();
      
    } catch (error: any) {
      console.error('Error importing questionnaire answers:', error);
      alert(`Failed to import questionnaire answers: ${error.message}`);
    } finally {
      setIsImportingAnswers(false);
    }
  };

  // Handle vendor update
  const handleUpdateVendor = async (vendorData: VendorFormData) => {
    try {
      await vendorAPI.update(vendorId, vendorData);
      setIsEditModalOpen(false);
      // Refresh vendor data
      fetchVendor();
    } catch (err: any) {
      console.error("Error updating vendor:", err);
      throw new Error(err.message || 'Failed to update vendor');
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

  // Show skeleton while loading
  if (isLoading) {
    return <VendorDetailSkeleton />;
  }

  // Show error state
  if (error || !vendor) {
    return (
      <>
        <Header />
        <div className="container mx-auto max-w-7xl py-8 px-4">
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Unable to load vendor details'}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/vendors')}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </button>
            <button
              onClick={fetchVendor}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <VendorDetailHeader vendor={vendor} onEdit={() => setIsEditModalOpen(true)} />
        
        <div className="container mx-auto max-w-7xl py-8 px-4">
          {/* Import Questionnaire Button */}
          {vendor.questionnaireAnswers?.length === 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-800">No Questionnaire Answers Found</h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Import questionnaire answers from localStorage if you have completed questionnaires for this vendor.
                  </p>
                </div>
                <button
                  onClick={handleImportQuestionnaireAnswers}
                  disabled={isImportingAnswers}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImportingAnswers ? 'Importing...' : 'Import Questionnaire Answers'}
                </button>
              </div>
            </div>
          )}

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
              <VendorRiskAssessment vendorId={vendor.id} />
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