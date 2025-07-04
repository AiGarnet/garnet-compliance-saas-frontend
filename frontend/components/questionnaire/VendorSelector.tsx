"use client";

import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { safeMap } from '@/lib/utils/arrayUtils';
import { vendors as vendorAPI } from '../../lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface Vendor {
  id: string;
  name: string;
  companyName: string;
  status: string;
  region?: string;
  industry?: string;
}

interface VendorSelectorProps {
  onVendorSelect: (vendorId: string) => void;
  selectedVendorId?: string;
}

const VendorSelector: React.FC<VendorSelectorProps> = ({ 
  onVendorSelect, 
  selectedVendorId 
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, token, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchVendors();
    } else {
      setError("Authentication required. Please log in to continue.");
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching vendors from API with authentication...');
      console.log('Auth status:', { isAuthenticated, hasToken: !!token });
      
      // Ensure token is available in localStorage before making the request
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        console.error('No auth token found in localStorage');
        setError('Authentication token missing. Please log in again.');
        setTimeout(() => {
          logout();
          router.push('/auth/login');
        }, 2000);
        return;
      }
      
      const response = await vendorAPI.getAll();
      
      console.log('Vendors API response:', response);
      
      // The API returns { success: true, data: [...] } structure
      const vendorList = response && response.data && Array.isArray(response.data) ? response.data : [];
      console.log('Extracted vendor list:', vendorList);
      
      if (vendorList.length === 0) {
        setError('No vendors found in the system');
        setVendors([]);
        return;
      }
      
      const formattedVendors = safeMap(vendorList, (vendor: any) => ({
        id: vendor.uuid || vendor.id?.toString() || vendor.vendorId?.toString(),
        name: vendor.companyName || vendor.name,
        companyName: vendor.companyName || vendor.name,
        status: vendor.status || 'QUESTIONNAIRE_PENDING',
        region: vendor.region || 'Unknown',
        industry: vendor.industry || 'Not specified'
      }));
      
      console.log('Formatted vendors:', formattedVendors);
      setVendors(formattedVendors);
      
      // Auto-select first vendor if none selected
      if (formattedVendors.length > 0 && !selectedVendorId) {
        console.log('Auto-selecting first vendor:', formattedVendors[0].id);
        onVendorSelect(formattedVendors[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      
      // Handle authentication errors specifically
      if (err.name === 'AuthenticationError' || (err.message && err.message.includes('Authentication'))) {
        setError('Authentication failed. Please log in again.');
        setTimeout(() => {
          logout();
          router.push('/auth/login');
        }, 2000);
        return;
      }
      
      setError(`Failed to load vendors: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  const handleVendorSelect = (vendorId: string) => {
    onVendorSelect(vendorId);
    setIsOpen(false);
  };

  const handleRetry = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
    } else {
      fetchVendors();
    }
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span className="text-gray-900 font-semibold">Select Your Company</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Choose the vendor account for this questionnaire submission</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 shadow-sm">
        <CardHeader className="bg-red-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-gray-900 font-semibold">Authentication Error</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">There was a problem loading your vendor data</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">{error}</p>
              <button 
                onClick={handleRetry}
                className="mt-3 flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{!isAuthenticated ? 'Log In' : 'Retry'}</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 rounded-t-lg">
        <CardTitle className="flex items-center space-x-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="text-gray-900 font-semibold">Select Your Company</span>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Choose the vendor account for this questionnaire submission</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                {selectedVendor ? (
                  <>
                    <div className="font-semibold text-gray-900">{selectedVendor.companyName}</div>
                    <div className="text-sm text-gray-500">
                      {selectedVendor.industry && `${selectedVendor.industry} • `}
                      {selectedVendor.region} • {selectedVendor.status}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 font-medium">Choose your company...</div>
                )}
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {vendors.length === 0 ? (
                <div className="p-4 text-gray-500 text-center font-medium">
                  No vendors available
                </div>
              ) : (
                safeMap(vendors, (vendor: Vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => handleVendorSelect(vendor.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                      selectedVendorId === vendor.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-semibold text-gray-900">{vendor.companyName}</div>
                        <div className="text-sm text-gray-500">
                          {vendor.industry && `${vendor.industry} • `}
                          {vendor.region} • 
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                            vendor.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800'
                              : vendor.status === 'QUESTIONNAIRE_PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {vendor.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        
        {selectedVendor && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">
                Questionnaire will be associated with {selectedVendor.companyName}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorSelector; 