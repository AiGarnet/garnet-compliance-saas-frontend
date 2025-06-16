"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, ArrowLeft, Building2 } from 'lucide-react';
import Header from '@/components/Header';
import { VendorWorksList, VendorWork } from '@/components/vendors/VendorWorksList';
import { VendorWorkForm, VendorWorkFormData } from '@/components/vendors/VendorWorkForm';
import { vendors } from '@/lib/api';
import { useAuthGuard } from '@/lib/auth/useAuthGuard';

const VendorWorksPage = () => {
  const params = useParams();
  const router = useRouter();
  const vendorId = params?.id as string;
  
  const [vendor, setVendor] = useState<any>(null);
  const [works, setWorks] = useState<VendorWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWork, setEditingWork] = useState<VendorWork | null>(null);
  const [error, setError] = useState<string>('');

  // Protect this page
  const { isLoading: authLoading } = useAuthGuard();

  // Fetch vendor details and works
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch vendor details
      const vendorResponse = await vendors.getById(vendorId);
      setVendor(vendorResponse.vendor);

      // Fetch vendor works
      const worksResponse = await vendors.works.getAll(vendorId);
      setWorks(worksResponse.works || []);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchData();
    }
  }, [vendorId]);

  const handleCreateWork = async (data: VendorWorkFormData) => {
    try {
      const response = await vendors.works.create(vendorId, data);
      setWorks(prev => [response.work, ...prev]);
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Failed to create work:', err);
      throw new Error(err.message || 'Failed to create work');
    }
  };

  const handleUpdateWork = async (data: VendorWorkFormData) => {
    if (!editingWork) return;

    try {
      const response = await vendors.works.update(vendorId, editingWork.id, data);
      setWorks(prev => prev.map(work => 
        work.id === editingWork.id ? response.work : work
      ));
      setEditingWork(null);
    } catch (err: any) {
      console.error('Failed to update work:', err);
      throw new Error(err.message || 'Failed to update work');
    }
  };

  const handleSaveWork = async (data: VendorWorkFormData) => {
    try {
      if (editingWork) {
        // Update existing work
        const response = await vendors.works.update(vendorId, editingWork.id, data);
        setWorks(prev => prev.map(work => 
          work.id === editingWork.id ? response.work : work
        ));
      } else {
        // Create new work as draft
        const response = await vendors.works.create(vendorId, data);
        setWorks(prev => [response.work, ...prev]);
      }
    } catch (err: any) {
      console.error('Failed to save work:', err);
      throw new Error(err.message || 'Failed to save work');
    }
  };

  const handleDeleteWork = async (workId: string) => {
    try {
      await vendors.works.delete(vendorId, workId);
      setWorks(prev => prev.filter(work => work.id !== workId));
    } catch (err: any) {
      console.error('Failed to delete work:', err);
      throw new Error(err.message || 'Failed to delete work');
    }
  };

  const handleToggleShare = async (workId: string, shareToTrustPortal: boolean) => {
    try {
      const workToUpdate = works.find(work => work.id === workId);
      if (!workToUpdate) return;

      const response = await vendors.works.update(vendorId, workId, { shareToTrustPortal });
      setWorks(prev => prev.map(work => 
        work.id === workId ? response.work : work
      ));
    } catch (err: any) {
      console.error('Failed to toggle share status:', err);
      throw new Error(err.message || 'Failed to update share status');
    }
  };

  const handleEditWork = (work: VendorWork) => {
    setEditingWork(work);
    setShowAddForm(true);
  };

  const handleGenerateInviteLink = async () => {
    try {
      const response = await vendors.trustPortal.generateInviteLink(vendorId);
      return response.inviteLink;
    } catch (err: any) {
      console.error('Failed to generate invite link:', err);
      throw new Error(err.message || 'Failed to generate invite link');
    }
  };

  const handleBackToVendor = () => {
    router.push(`/vendors/${vendorId}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <VendorWorkForm
            initialData={editingWork ? {
              projectName: editingWork.projectName,
              description: editingWork.description,
              status: editingWork.status,
              startDate: editingWork.startDate || '',
              endDate: editingWork.endDate || '',
              clientName: editingWork.clientName || '',
              technologies: editingWork.technologies,
              category: editingWork.category || '',
              shareToTrustPortal: editingWork.shareToTrustPortal,
              evidenceFiles: editingWork.evidenceFiles,
              questionnaireAnswers: editingWork.questionnaireAnswers,
              isDraft: editingWork.isDraft
            } : undefined}
            onSubmit={editingWork ? handleUpdateWork : handleCreateWork}
            onSave={handleSaveWork}
            isEditing={!!editingWork}
            vendorId={vendorId}
            autoSave={true}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToVendor}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
                <Building2 className="mr-3 h-7 w-7 text-primary" />
                {vendor?.companyName || 'Vendor'} - Work Submissions
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and showcase your completed projects
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setEditingWork(null);
              setShowAddForm(true);
            }}
            className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Work
          </button>
        </div>

        {/* Works List */}
        <VendorWorksList
          works={works}
          onEdit={handleEditWork}
          onDelete={handleDeleteWork}
          onToggleShare={handleToggleShare}
          onGenerateInviteLink={handleGenerateInviteLink}
        />
      </main>
    </div>
  );
};

export default VendorWorksPage; 