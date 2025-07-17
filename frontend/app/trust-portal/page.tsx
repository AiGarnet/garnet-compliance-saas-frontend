'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Shield, FileText, Search, Users, ChevronRight, ExternalLink, CheckCircle, AlertTriangle, Eye, Star, Globe, Clock } from 'lucide-react';
import { vendors as vendorAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import Header from '@/components/Header';
import { MobileNavigation } from '@/components/MobileNavigation';
import { TrustPortalVendor } from '@/types/trustPortal';
import SubmissionHistory from '@/components/trust-portal/SubmissionHistory';
import Link from 'next/link';

export default function TrustPortalPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<TrustPortalVendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all vendors that have trust portal content
  const fetchVendors = async () => {
    try {
      setIsLoadingVendors(true);
      setError('');
      
      console.log('Fetching all vendors for trust portal...');
      const response = await vendorAPI.trustPortal.getVendorsWithItems();
      
      console.log('Trust portal API response:', response);
      
      // Handle the API response structure properly (same as vendors page)
      if (response.success && response.data && Array.isArray(response.data)) {
        const transformedVendors = response.data.map((vendor: any) => ({
          id: vendor.uuid || vendor.id || vendor.vendorId?.toString(),
          name: vendor.companyName || vendor.name || 'Unknown Vendor',
          status: vendor.status || 'Questionnaire Pending',
          industry: vendor.industry,
          region: vendor.region,
          description: vendor.description,
          website: vendor.website
        }));
        setVendors(transformedVendors);
        console.log('Loaded all vendors for trust portal:', transformedVendors);
      } else if (response.vendors && Array.isArray(response.vendors)) {
        // Handle legacy format if still returned
        const transformedVendors = response.vendors.map((vendor: any) => ({
          id: vendor.uuid || vendor.id || vendor.vendorId?.toString(),
          name: vendor.companyName || vendor.name || 'Unknown Vendor',
          status: vendor.status || 'Questionnaire Pending',
          industry: vendor.industry,
          region: vendor.region,
          description: vendor.description,
          website: vendor.website
        }));
        setVendors(transformedVendors);
        console.log('Loaded all vendors for trust portal (legacy format):', transformedVendors);
      } else {
        // No vendors found or error
        console.log('No vendors found or API error:', response);
        setVendors([]);
        if (!response.success) {
          setError(response.error?.message || 'Failed to load vendors');
        }
      }
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors. Please try again.');
      setVendors([]);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Fetch vendors immediately since trust portal is public
    fetchVendors();
  }, []);

  // Show loading while fetching vendors
  if (authLoading || isLoadingVendors) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trust portal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto py-8 px-4">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trust Portal</h1>
                <p className="text-gray-600">Browse vendors and explore their trust information</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search vendors, industries, or regions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Stats Card - Only showing Total Vendors */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 max-w-md">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Vendors
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {vendors.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions Section */}
          {isAuthenticated && (
            <div className="mb-8">
              <SubmissionHistory limit={5} showTitle={true} />
            </div>
          )}

          {/* Loading State */}
          {isLoadingVendors && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading vendors...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Vendors</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <button
                    onClick={fetchVendors}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vendors Grid */}
          {!isLoadingVendors && !error && (
            <>
              {filteredVendors.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No vendors found' : 'No trust portals available'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'Try adjusting your search terms or browse all vendors.' 
                      : 'Check back later as vendors complete their documentation.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVendors.map((vendor) => (
                    <div key={vendor.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {vendor.name}
                            </h3>
                            {vendor.industry && (
                              <p className="text-sm text-gray-600">{vendor.industry}</p>
                            )}
                          </div>
                        </div>

                        {vendor.description && (
                          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                            {vendor.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          {vendor.region && (
                            <span className="flex items-center">
                              <Globe className="h-4 w-4 mr-1" />
                              {vendor.region}
                            </span>
                          )}
                          {vendor.website && (
                            <a 
                              href={vendor.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Website
                            </a>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            href={`/trust-portal/vendor?id=${vendor.id}`}
                            className="flex-1 bg-primary text-white text-center py-2 px-4 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            <Eye className="h-4 w-4 inline mr-2" />
                            View Trust Portal
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <MobileNavigation />
    </>
  );
} 