"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Eye, PlusCircle, LogOut, User, CheckCircle, Shield } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ComplianceCard } from "@/components/dashboard/ComplianceCard";
import { QuestionnaireCard } from "@/components/dashboard/QuestionnaireCard";
import { VendorList } from "@/components/dashboard/VendorList";
import { OrganizationStats } from "@/components/dashboard/OrganizationStats";
import { MobileNavigation } from "@/components/MobileNavigation";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import { DevModeToggle } from "@/components/DevModeToggle";
import { isDevModeEnabled } from "@/lib/env-config";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLES } from "@/lib/auth/roles";
import { VendorStatus, Vendor } from "@/types/vendor";
import { vendors as vendorAPI } from "@/lib/api";
import { EditVendorModal } from "@/components/vendors/EditVendorModal";
import { DeleteVendorModal } from "@/components/vendors/DeleteVendorModal";
import { AddVendorModal } from "@/components/vendors/AddVendorModal";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useActivity } from "@/hooks/useActivity";
import { useToast } from "@/components/ui/Toast";
import activityApiService from "@/lib/services/activityApiService";

// Vendor data
const mockVendors: Vendor[] = [
  { id: "1", name: "Acme Corp", status: VendorStatus.QUESTIONNAIRE_PENDING, contactEmail: "acme@acme.com", createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "Globex Ltd", status: VendorStatus.IN_REVIEW, contactEmail: "globex@globex.com", createdAt: new Date(), updatedAt: new Date() },
  { id: "3", name: "Stark Industries", status: VendorStatus.APPROVED, contactEmail: "stark@stark.com", createdAt: new Date(), updatedAt: new Date() },
  { id: "4", name: "Wayne Enterprises", status: VendorStatus.QUESTIONNAIRE_PENDING, contactEmail: "wayne@wayne.com", createdAt: new Date(), updatedAt: new Date() },
  { id: "5", name: "Oscorp Industries", status: VendorStatus.IN_REVIEW, contactEmail: "oscorp@oscorp.com", createdAt: new Date(), updatedAt: new Date() },
  { id: "6", name: "Umbrella Corporation", status: VendorStatus.APPROVED, contactEmail: "umbrella@umbrella.com", createdAt: new Date(), updatedAt: new Date() },
];

function DashboardContent() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<{ id: string; name: string } | null>(null);

  // Get user role for conditional rendering
  const userRole = user?.role;
  const isSalesProfessional = userRole === ROLES.SALES_PROFESSIONAL;
  const isFounder = userRole === ROLES.FOUNDER;

  // Activity tracking
  const { 
    logClientCreated, 
    logClientUpdated, 
    logClientDeleted, 
    logClientStatusChanged,
    addSampleActivities: addSampleActivitiesToService 
  } = useActivity();

  useEffect(() => {
    // Check developer mode on mount and when it changes
    setIsDevMode(isDevModeEnabled());
    
    // Setup listener for storage changes (in case dev mode is toggled in another tab)
    const handleStorageChange = () => {
      setIsDevMode(isDevModeEnabled());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Setup toast notifications from API service
  useEffect(() => {
    const toastCallback = (toast: any) => {
      addToast(toast);
    };

    activityApiService.onToast(toastCallback);
    
    // Start polling for activity updates
    const pollingInterval = activityApiService.startActivityPolling(30000, user?.id);

    return () => {
      activityApiService.offToast(toastCallback);
      activityApiService.stopActivityPolling(pollingInterval);
    };
  }, [user?.id, addToast]);

  // Fetch vendors from API using the new activity-enabled service
  const fetchVendors = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate error for testing in dev mode
      if (simulateError) {
        throw new Error("Failed to fetch clients");
      }
      
      console.log('Dashboard: Fetching clients from backend API...');
      const response = await activityApiService.getVendors();
      console.log('Dashboard: Backend API response:', response);
      
      if (response.success && response.data) {
        // Transform API response to match our Vendor type
        const transformedVendors = response.data.map((vendor: any) => ({
          id: vendor.id || vendor.vendorId?.toString() || vendor.uuid,
          name: vendor.name || vendor.companyName,
          status: vendor.status || VendorStatus.QUESTIONNAIRE_PENDING,
          contactEmail: vendor.contactEmail,
          createdAt: new Date(vendor.createdAt || vendor.created_at),
          updatedAt: new Date(vendor.updatedAt || vendor.updated_at)
        }));
        
        setVendors(transformedVendors);
        setIsLoading(false);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch clients');
      }
    } catch (err: any) {
      console.error("Error fetching clients:", err);
      setError('Unable to load clients.');
      setIsLoading(false);
    }
  };
  
  // Toggle error simulation for testing
  const toggleErrorSimulation = () => {
    setSimulateError(prev => !prev);
    fetchVendors();
  };

  // Initial fetch on component mount
  useEffect(() => {
    // Debug authentication state
    console.log('🔍 Dashboard Authentication Check:', {
      user,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      organizationId: user?.organization_id,
      organization: user?.organization,
      authToken: typeof window !== 'undefined' ? !!localStorage.getItem('authToken') : 'N/A',
      userData: typeof window !== 'undefined' ? !!localStorage.getItem('userData') : 'N/A'
    });
    
    fetchVendors();
  }, []);

  // SECURITY: Check if user has organization access
  if (user && !user.organization_id) {
    return (
      <div className="min-h-screen bg-body-bg dark:bg-body-bg flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Organization Access Required
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be associated with an organization to access the dashboard. 
            Please contact your administrator to set up your organization access.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('authToken');
                sessionStorage.removeItem('authToken');
                window.location.href = '/auth/login';
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handler for editing a vendor
  const handleEditVendor = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setSelectedVendor(vendor);
      setEditModalOpen(true);
    }
  };

  // Handler for deleting a vendor
  const handleDeleteVendor = (vendorId: string, vendorName: string) => {
    setVendorToDelete({ id: vendorId, name: vendorName });
    setDeleteModalOpen(true);
  };

  // Handler for saving edited vendor using backend API
  const handleSaveVendor = async (vendorData: Partial<Vendor>) => {
    if (!selectedVendor) return;
    
    try {
      console.log('Saving vendor data:', vendorData);
      
      // Check if status changed to log activity
      const statusChanged = vendorData.status && vendorData.status !== selectedVendor.status;
      const previousStatus = selectedVendor.status;
      
      // Call backend API with activity logging
      const response = await activityApiService.updateVendor(selectedVendor.id, {
        companyName: (vendorData as any).companyName || vendorData.name, // Handle both companyName and name properties
        contactEmail: vendorData.contactEmail,
        status: vendorData.status,
        previousStatus // Include for activity logging
      });
      
      if (response.success && response.data) {
        // Update local state with the returned data
        setVendors(prev => prev.map(v => 
          v.id === selectedVendor.id 
            ? { 
                ...v, 
                ...vendorData,
                updatedAt: new Date()
              }
            : v
        ));

        // The backend automatically logs activities and shows toasts
        setEditModalOpen(false);
        setSelectedVendor(null);
        
        // Refresh activities to show the update in Recent Activities
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshActivities'));
        }, 1000);
      } else {
        throw new Error(response.error?.message || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update client',
        duration: 7000
      });
    }
  };

  // Handler for confirming vendor deletion using backend API
  const handleConfirmDelete = async (vendorId: string) => {
    try {
      console.log('Deleting vendor:', vendorId);
      
      // Find the vendor to get its name for logging
      const vendorToDeleteData = vendors.find(v => v.id === vendorId);
      const vendorName = vendorToDeleteData?.name || 'Unknown Client';
      
      // Call backend API with activity logging
      const response = await activityApiService.deleteVendor(vendorId);
      
      if (response.success) {
        // Remove from local state
        setVendors(prev => prev.filter(v => v.id !== vendorId));

        // The backend automatically logs activities and shows toasts
        setDeleteModalOpen(false);
        setVendorToDelete(null);
        
        // Refresh activities to show the deletion in Recent Activities
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshActivities'));
        }, 1000);
      } else {
        throw new Error(response.error?.message || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete client',
        duration: 7000
      });
    }
  };

  const handleAddVendor = async (vendorData: any) => {
    try {
      console.log('🔄 Creating vendor with data:', vendorData);
      console.log('👤 Current user context:', {
        userId: user?.id,
        userEmail: user?.email,
        organizationId: user?.organization_id,
        organization: user?.organization,
        role: user?.role
      });
      
      // Check if user is authenticated and has organization
      if (!user) {
        throw new Error('You must be logged in to create vendors');
      }
      
      if (!user.organization_id) {
        throw new Error('You must be associated with an organization to create vendors');
      }
      
      // Map form data to API format
      const apiData = {
        companyName: vendorData.companyName,
        region: vendorData.region,
        contactEmail: vendorData.contactEmail,
        contactName: vendorData.contactName,
        website: vendorData.website,
        industry: vendorData.industry,
        description: vendorData.description,
        status: vendorData.status || 'Questionnaire Pending'
      };
      
      console.log('📤 Sending vendor creation request:', apiData);
      const result = await vendorAPI.create(apiData);
      console.log('📥 Vendor creation response:', result);
      
      if (result.success && result.data) {
        addToast({
          type: 'success',
          title: 'Client Added',
          message: `Client "${result.data.companyName || result.data.name}" has been added successfully!`,
          duration: 5000
        });
        
        // Refresh the vendor list
        await fetchVendors();
        setAddModalOpen(false);
      } else {
        throw new Error(result.error?.message || 'Failed to create vendor');
      }
    } catch (error: any) {
      console.error('❌ Error adding vendor:', error);
      
      let errorMessage = 'Failed to add client. Please try again.';
      let errorTitle = 'Error';
      
      // Handle specific error types
      if (error.name === 'AuthenticationError') {
        errorTitle = 'Authentication Required';
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.name === 'OrganizationError') {
        errorTitle = 'Organization Access Required';
        errorMessage = 'You need to be associated with an organization to create clients.';
      } else if (error.message.includes('organization')) {
        errorTitle = 'Organization Required';
        errorMessage = 'Organization access is required to create clients.';
      } else if (error.message.includes('authentication') || error.message.includes('login')) {
        errorTitle = 'Authentication Required';
        errorMessage = 'Please log in to continue.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addToast({
        type: 'error',
        title: errorTitle,
        message: errorMessage,
        duration: 7000
      });
      
      // Don't throw the error to prevent the modal from staying open unnecessarily
      // throw error;
    }
  };

  return (
    <>
      <Header />
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8 bg-body-bg dark:bg-body-bg">
        {/* Top bar with conditional dev mode toggle */}
        <div className="flex justify-between items-center">
          <section className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Welcome back, {user?.full_name || user?.email || 'User'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {user?.organization ? `${user.organization} - ` : ''}Here's an overview of your organization's compliance status
            </p>
          </section>
          {/* Dev mode toggle - hidden for both Sales Professional and Founder */}
          {!isSalesProfessional && !isFounder && (
            <DevModeToggle />
          )}
        </div>
        
        {/* Enhanced Organization Stats - Shows real-time data */}
        <OrganizationStats />
        
        {/* Debug controls for testing - only visible in dev mode and not for Sales Professional or Founder */}
        {isDevMode && !isSalesProfessional && !isFounder && (
          <div className="mb-6 p-4 bg-controls-bg rounded-md">
            <h2 className="text-lg font-semibold mb-2">Client List Testing Controls</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleErrorSimulation}
                className={cn(
                  "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
                  simulateError 
                    ? "bg-danger text-white hover:bg-danger/90 focus:ring-danger" 
                    : "bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                )}
              >
                {simulateError ? "Error Mode: ON" : "Error Mode: OFF"}
              </button>
              <button
                onClick={fetchVendors}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                Reload Clients
              </button>
              <button
                onClick={addSampleActivitiesToService}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              >
                Add Sample Activities
              </button>
            </div>
            <p className="mt-2 text-sm">
              Use these controls to test the error handling and retry functionality of the client list, and activity tracking system.
            </p>
          </div>
        )}
        
        {/* Client Section - Always visible */}
        <VendorList 
          vendors={vendors}
          className="min-h-[300px]" 
          isLoading={isLoading}
          error={error}
          onRetry={fetchVendors}
          onEditVendor={handleEditVendor}
          onDeleteVendor={handleDeleteVendor}
          onAddVendor={() => setAddModalOpen(true)}
        />
        
        {/* Two Column Layout - Conditional based on role */}
        <div className={cn(
          "grid gap-6",
          isFounder ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          {/* Pending Tasks - Hidden for Founder */}
          {!isFounder && (
            <section className="bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Pending Tasks</h2>
              <a href="#" className="text-sm text-primary font-medium hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1">
                View All
              </a>
            </div>
            
            <ul className="space-y-4" role="list">
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">Complete SOC 2 gap assessment</span>
                  <span className="bg-danger-light text-danger dark:bg-danger-light dark:text-danger-color text-xs px-2 py-1 rounded-full">High</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Assigned to you</span>
                  <span className="text-gray-600 dark:text-gray-300">Due in 2 days</span>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">Review vendor documentation</span>
                  <span className="bg-warning-light text-warning dark:bg-warning-light dark:text-warning-color text-xs px-2 py-1 rounded-full">Medium</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Assigned to you</span>
                  <span className="text-gray-600 dark:text-gray-300">Due in 5 days</span>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">Conduct security awareness training</span>
                  <span className="bg-secondary-light text-secondary dark:bg-secondary-light dark:text-secondary-color text-xs px-2 py-1 rounded-full">Low</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Assigned to you</span>
                  <span className="text-gray-600 dark:text-gray-300">Due in 1 week</span>
                </div>
              </li>
            </ul>
          </section>
          )}
          
          {/* Recent Activity - Dynamic */}
          <RecentActivity limit={5} />
        </div>
      </main>

      {/* Edit Vendor Modal */}
      <EditVendorModal
        vendor={selectedVendor}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedVendor(null);
        }}
        onSave={handleSaveVendor}
      />

      {/* Delete Vendor Modal */}
      <DeleteVendorModal
        vendorName={vendorToDelete?.name || null}
        vendorId={vendorToDelete?.id || null}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setVendorToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
        }}
        onSubmit={handleAddVendor}
      />
    </>
  );
}

export default function DashboardPage() {
  // Protect this page - redirect to login if not authenticated
  const { isLoading: authLoading } = useAuthGuard();

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

  return (
    <DashboardContent />
  );
}
