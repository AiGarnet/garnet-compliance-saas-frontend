"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, Plus, Eye, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import { useAuthGuard } from '@/lib/auth/useAuthGuard';
import { ChecklistUpload } from '@/components/checklists/ChecklistUpload';
import { ChecklistList } from '@/components/checklists/ChecklistList';
import { ChecklistService, Checklist, ChecklistQuestion } from '@/lib/services/checklistService';
import { vendors as vendorAPI } from '@/lib/api';
import { safeMap } from '@/lib/utils/arrayUtils';

const ChecklistsPage = () => {
  const router = useRouter();
  const { isLoading: authLoading } = useAuthGuard();

  // State
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  // Load checklists when vendor is selected
  useEffect(() => {
    if (selectedVendorId) {
      loadChecklists();
    }
  }, [selectedVendorId]);

  const loadVendors = async () => {
    try {
      const response = await vendorAPI.getAll();
      setVendors(response || []);
      
      // Auto-select first vendor if available
      if (response && response.length > 0) {
        setSelectedVendorId(response[0].uuid);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      setError('Failed to load vendors');
    }
  };

  const loadChecklists = async () => {
    if (!selectedVendorId) return;

    setLoading(true);
    setError(null);

    try {
      const checklistsData = await ChecklistService.getVendorChecklists(selectedVendorId);
      setChecklists(checklistsData);
    } catch (error) {
      console.error('Error loading checklists:', error);
      setError('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (checklist: Checklist, questions: ChecklistQuestion[]) => {
    // Add new checklist to the list
    setChecklists(prev => [checklist, ...prev]);
    setShowUpload(false);
    
    // Show success message
    setError(null);
    
    // Optionally navigate to AI questionnaire page to view questions
    if (questions.length > 0) {
      router.push(`/questionnaires?vendor=${selectedVendorId}&checklist=${checklist.id}`);
    }
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleViewChecklist = (checklist: Checklist) => {
    // Navigate to questionnaire page with this checklist's questions
    router.push(`/questionnaires?vendor=${checklist.vendorId}&checklist=${checklist.id}`);
  };

  const handleDeleteChecklist = async (checklist: Checklist) => {
    if (!confirm(`Are you sure you want to delete "${checklist.name}"? This will also delete all associated questions and answers.`)) {
      return;
    }

    try {
      await ChecklistService.deleteChecklist(checklist.id, checklist.vendorId);
      setChecklists(prev => prev.filter(c => c.id !== checklist.id));
    } catch (error) {
      console.error('Error deleting checklist:', error);
      setError('Failed to delete checklist');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="h-8 w-8 mr-3 text-blue-600" />
                Compliance Checklists
              </h1>
              <p className="mt-2 text-gray-600">
                Upload and manage your compliance checklists. Questions will be automatically extracted and made available for AI processing.
              </p>
            </div>
            
            {selectedVendorId && (
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Checklist
              </button>
            )}
          </div>
        </div>

        {/* Vendor Selection */}
        <div className="mb-8 bg-white rounded-lg border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Vendor</h2>
          <div className="max-w-sm">
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a vendor...</option>
              {safeMap(vendors, (vendor: any) => (
                <option key={vendor.uuid} value={vendor.uuid}>
                  {vendor.company_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {showUpload && selectedVendorId && (
          <div className="mb-8">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload New Checklist</h2>
              <ChecklistUpload
                vendorId={selectedVendorId}
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
            </div>
          </div>
        )}

        {/* Checklists List */}
        {selectedVendorId && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Your Checklists ({checklists.length})
              </h2>
              <div className="text-sm text-gray-500">
                Total questions extracted: {checklists.reduce((sum, checklist) => sum + checklist.questionCount, 0)}
              </div>
            </div>

            <ChecklistList
              checklists={checklists}
              onViewChecklist={handleViewChecklist}
              onDeleteChecklist={handleDeleteChecklist}
              loading={loading}
            />
          </div>
        )}

        {/* Empty State */}
        {!selectedVendorId && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a vendor to get started
            </h3>
            <p className="text-gray-500">
              Choose a vendor from the dropdown above to view and manage their compliance checklists.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistsPage; 