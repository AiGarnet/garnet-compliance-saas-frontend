"use client";

import React, { useState, useEffect } from "react";
import { Building2, ExternalLink, Filter, Plus, Search, SlidersHorizontal, Users, Trash2 } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { VendorFormData } from "@/types/vendor";
import { vendors as vendorAPI } from "@/lib/api";
import Header from "@/components/Header";
import { AddVendorModal } from "@/features/vendors/components/AddVendorModal";
import { DeleteVendorModal } from "@/features/vendors/components/DeleteVendorModal";
import { EvidenceCount } from "@/components/vendors/EvidenceCount";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useRouter } from "next/navigation";

// Simple vendor interface for this page
interface SimpleVendor {
  id: string;
  name: string;
  status: string;
}

const VendorsPage = () => {
  const [vendors, setVendors] = useState<SimpleVendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    vendorId: string;
    vendorName: string;
  }>({
    isOpen: false,
    vendorId: '',
    vendorName: '',
  });
  const router = useRouter();

  // Protect this page - redirect to login if not authenticated
  const { isLoading: authLoading } = useAuthGuard();

  // Fetch vendors from API
  const fetchVendors = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Frontend: Fetching vendors from API...');
      const response = await vendorAPI.getAll();
      console.log('Frontend: API response:', response);
      
      // Handle the API response structure properly
      if (response.vendors && Array.isArray(response.vendors)) {
        const transformedVendors = response.vendors.map((vendor: any) => ({
          id: vendor.uuid || vendor.id || vendor.vendorId?.toString(),
          name: vendor.companyName || vendor.name || 'Unknown Vendor',
          status: vendor.status || 'Questionnaire Pending'
        }));
        setVendors(transformedVendors);
        console.log('Frontend: Successfully loaded vendors from database:', transformedVendors);
      } else if (response.length && Array.isArray(response)) {
        // Handle case where response is directly an array
        const transformedVendors = response.map((vendor: any) => ({
          id: vendor.uuid || vendor.id || vendor.vendorId?.toString(),
          name: vendor.companyName || vendor.name || 'Unknown Vendor',
          status: vendor.status || 'Questionnaire Pending'
        }));
        setVendors(transformedVendors);
        console.log('Frontend: Successfully loaded vendors from database:', transformedVendors);
      } else {
        // No vendors found in database
        console.log('Frontend: No vendors found in database');
        setVendors([]);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching vendors from API:", err);
      setError('Failed to load vendors from database. Please check your connection and try again.');
      setVendors([]);
      setIsLoading(false);
    }
  };

  // Handle adding a new vendor
  const handleAddVendor = async (vendorData: VendorFormData) => {
    try {
      console.log('Creating vendor with data:', vendorData);
      
      // Transform frontend data to match backend DTO
      const backendData = {
        companyName: vendorData.name, // Map name to companyName
        region: vendorData.region || 'Not Specified',
        contactEmail: vendorData.contactEmail || '',
        contactName: vendorData.contactName,
        website: vendorData.website,
        industry: vendorData.industry,
        description: vendorData.description,
        status: vendorData.status,
        riskScore: vendorData.riskScore,
        riskLevel: vendorData.riskLevel
      };

      console.log('Sending backend data:', backendData);
      const response = await vendorAPI.create(backendData);
      console.log('Vendor creation response:', response);
      
      // Transform the new vendor to match our interface
      const newVendor = {
        id: response.vendor.uuid || response.vendor.id || response.vendor.vendorId?.toString(),
        name: response.vendor.companyName || response.vendor.name || vendorData.name,
        status: response.vendor.status || 'Questionnaire Pending'
      };
      
      setVendors(prev => [...prev, newVendor]);
      setIsAddModalOpen(false);
      console.log('Frontend: Successfully created new vendor:', newVendor);
    } catch (err: any) {
      console.error("Error creating vendor:", err);
      
      // Handle specific authentication errors
      if (err.name === 'AuthenticationError' || err.message?.includes('Authentication failed')) {
        throw new Error('You need to be logged in to create vendors. Please log in and try again.');
      }
      
      // Handle other specific errors
      if (err.message?.includes('401')) {
        throw new Error('Authentication required. Please log in and try again.');
      }
      
      if (err.message?.includes('403')) {
        throw new Error('You don\'t have permission to create vendors.');
      }
      
      throw new Error(err.message || 'Failed to create vendor. Please try again.');
    }
  };

  // Handle viewing a vendor
  const handleViewVendor = (vendorId: string) => {
    router.push(`/vendors/${vendorId}`);
  };

  // Handle editing a vendor (placeholder for now - you can implement edit modal later)
  const handleEditVendor = (vendorId: string) => {
    // For now, navigate to the vendor detail page
    // Later you can implement an edit modal or dedicated edit page
    router.push(`/vendors/${vendorId}?edit=true`);
  };

  // Handle opening delete modal
  const handleDeleteVendor = (vendorId: string, vendorName: string) => {
    setDeleteModal({
      isOpen: true,
      vendorId,
      vendorName,
    });
  };

  // Handle confirming vendor deletion
  const handleConfirmDelete = async (vendorId: string) => {
    try {
      console.log('Deleting vendor with ID:', vendorId);
      await vendorAPI.delete(vendorId);
      
      // Remove vendor from the list
      setVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
      console.log('Frontend: Successfully deleted vendor:', vendorId);
    } catch (err: any) {
      console.error("Error deleting vendor:", err);
      
      // Handle specific errors
      if (err.message?.includes('404')) {
        throw new Error('Vendor not found. It may have already been deleted.');
      }
      
      if (err.message?.includes('401')) {
        throw new Error('Authentication required. Please log in and try again.');
      }
      
      if (err.message?.includes('403')) {
        throw new Error('You don\'t have permission to delete vendors.');
      }
      
      throw new Error(err.message || 'Failed to delete vendor. Please try again.');
    }
  };

  // Handle closing delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      vendorId: '',
      vendorName: '',
    });
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchVendors();
  }, []); // Empty dependency array to run only once

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
    <>
      <Header />
          
      <main id="main-content" className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Building2 className="mr-3 h-7 w-7 text-primary" />
              Vendors
            </h1>
            <p className="text-gray-600 mt-1">Manage and assess your third-party vendors</p>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Vendor
            </button>
          </div>
        </div>
        
        {/* Vendor List */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading vendors from database...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchVendors}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : vendors.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first vendor to begin the compliance assessment process.
              </p>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Add Your First Vendor
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Evidence Files
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {vendor.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            vendor.status === 'Approved' 
                              ? 'bg-green-100 text-green-800'
                              : vendor.status === 'In Review' || vendor.status === 'Pending Review'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {vendor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <EvidenceCount vendorId={vendor.id} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewVendor(vendor.id)}
                            className="text-primary hover:text-primary/80 mr-4"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditVendor(vendor.id)}
                            className="text-gray-600 hover:text-gray-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                            className="text-red-600 hover:text-red-800 inline-flex items-center"
                            title="Delete vendor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNavigation />
      
      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddVendor}
      />

      {/* Delete Vendor Modal */}
      <DeleteVendorModal
        isOpen={deleteModal.isOpen}
        vendorName={deleteModal.vendorName}
        vendorId={deleteModal.vendorId}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default VendorsPage; 
