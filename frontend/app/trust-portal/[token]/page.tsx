"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Building2, Shield, FileText } from 'lucide-react';
import { vendors } from '@/lib/api';

const TrustPortalPublicPage = () => {
  const params = useParams();
  const token = params?.token as string;
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchTrustPortalData = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        setError('');
        
        const response = await vendors.trustPortal.getByInviteToken(token);
        setData(response);
      } catch (err: any) {
        console.error('Failed to fetch trust portal data:', err);
        setError(err.message || 'Failed to load trust portal data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrustPortalData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trust portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            The invite link may have expired or is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trust Portal</h1>
              <p className="text-sm text-gray-600">Vendor Compliance & Work Portfolio</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {data && (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <div className="flex items-center mb-4">
                <Building2 className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Vendor Profile</h2>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {data.vendor?.companyName || 'Vendor Name'}
              </h3>
              
              {data.vendor?.description && (
                <p className="text-sm text-gray-600">{data.vendor.description}</p>
              )}
            </div>

            {data.works && data.works.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <div className="flex items-center mb-6">
                  <FileText className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Work Portfolio</h2>
                </div>
                
                <div className="grid gap-6">
                  {data.works.map((work: any) => (
                    <div key={work.id} className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {work.projectName}
                      </h3>
                      
                      {work.description && (
                        <p className="text-gray-600 mb-4">{work.description}</p>
                      )}
                      
                      {work.technologies && work.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {work.technologies.map((tech: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default TrustPortalPublicPage; 