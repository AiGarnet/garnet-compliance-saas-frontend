'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Shield, FileText, Search, Users, ChevronRight, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { vendors as vendorAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import Header from '@/components/Header';
import { MobileNavigation } from '@/components/MobileNavigation';

interface TrustPortalVendor {
  id: string;
  name: string;
  status: string;
  industry?: string;
  region?: string;
  description?: string;
  website?: string;
}

interface VendorTrustPortalData {
  vendor: {
    companyName: string;
    region?: string;
    industry?: string;
    description?: string;
    website?: string;
  };
  works: Array<{
    id: string;
    projectName: string;
    description: string;
    status: string;
    startDate: string;
    endDate?: string;
    clientName?: string;
    technologies: string[];
    category: string;
  }>;
  questionnaireAnswers: Array<{
    id: string;
    questionId: string;
    question: string;
    answer: string;
    createdAt: string;
  }>;
  evidenceFiles: Array<{
    id: string;
    fileName: string;
    fileType: string;
    uploadDate: string;
    category: string;
  }>;
}

export default function TrustPortalPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<TrustPortalVendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<TrustPortalVendor | null>(null);
  const [vendorData, setVendorData] = useState<VendorTrustPortalData | null>(null);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [isLoadingVendorData, setIsLoadingVendorData] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch vendors for the current user
  const fetchVendors = async () => {
    try {
      setIsLoadingVendors(true);
      setError('');
      
      console.log('Fetching vendors for trust portal...');
      const response = await vendorAPI.getAll();
      
      // Transform vendors for trust portal view
      const transformedVendors = response.vendors?.map((vendor: any) => ({
        id: vendor.uuid || vendor.id || vendor.vendorId?.toString(),
        name: vendor.companyName || vendor.name || 'Unknown Vendor',
        status: vendor.status || 'Questionnaire Pending',
        industry: vendor.industry,
        region: vendor.region,
        description: vendor.description,
        website: vendor.website
      })) || [];
      
      setVendors(transformedVendors);
      console.log('Loaded vendors for trust portal:', transformedVendors);
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors. Please try again.');
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Fetch detailed trust portal data for selected vendor
  const fetchVendorTrustPortalData = async (vendorId: string) => {
    try {
      setIsLoadingVendorData(true);
      setError('');
      
      console.log('Fetching trust portal data for vendor:', vendorId);
      const data = await vendorAPI.trustPortal.getData(vendorId);
      
      console.log('Trust portal data received:', data);
      setVendorData(data);
    } catch (err: any) {
      console.error('Error fetching vendor trust portal data:', err);
      setError('Failed to load vendor data. Please try again.');
    } finally {
      setIsLoadingVendorData(false);
    }
  };

  // Handle vendor selection
  const handleVendorSelect = (vendor: TrustPortalVendor) => {
    setSelectedVendor(vendor);
    fetchVendorTrustPortalData(vendor.id);
  };

  // Handle back to vendor list
  const handleBackToList = () => {
    setSelectedVendor(null);
    setVendorData(null);
  };

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in review':
      case 'pending review':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVendors();
    }
  }, [isAuthenticated]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trust portal...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trust Portal Access</h1>
          <p className="text-gray-600 mb-4">Please sign in to access the trust portal.</p>
          <a 
            href="/auth/login" 
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto py-8 px-4">
          {!selectedVendor ? (
            // Vendor List View
            <>
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <Shield className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Trust Portal</h1>
                    <p className="text-gray-600">View vendor compliance and work portfolios</p>
                  </div>
                </div>
                
                <div className="max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {isLoadingVendors ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600">Loading vendors...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button 
                    onClick={fetchVendors}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No vendors found' : 'No vendors available'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'No vendors have been added yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      onClick={() => handleVendorSelect(vendor)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                              {vendor.name}
                            </h3>
                            {vendor.industry && (
                              <p className="text-sm text-gray-600">{vendor.industry}</p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(vendor.status)}`}>
                            {vendor.status}
                          </span>
                        </div>
                        
                        {vendor.region && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Region:</span>
                            <span className="text-sm font-medium text-gray-900">{vendor.region}</span>
                          </div>
                        )}
                      </div>
                      
                      {vendor.description && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{vendor.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-bold">Vendor Detail View</h2>
              <p>Selected vendor: {selectedVendor.name}</p>
              <button 
                onClick={handleBackToList}
                className="mt-4 bg-primary text-white px-4 py-2 rounded-md"
              >
                Back to List
              </button>
            </div>
          )}
        </main>
      </div>
      
      <MobileNavigation />
    </>
  );
} 
