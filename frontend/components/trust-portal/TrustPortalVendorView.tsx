'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Shield, FileText, Share2, Copy, ExternalLink } from 'lucide-react';
import { vendors } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { safeMap } from '@/lib/utils/arrayUtils';

export const TrustPortalVendorView: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Debug logging
  console.log('TrustPortalVendorView Debug:', {
    user,
    userId: user?.id,
    userRole: user?.role
  });

  useEffect(() => {
    const fetchTrustPortalData = async () => {
      if (!user?.id) {
        console.log('No user ID available');
        setError('User ID not available');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        console.log('Fetching trust portal data for user:', user.id);
        
        // Get trust portal data for the authenticated vendor
        const response = await vendors.trustPortal.getData(user.id);
        console.log('Trust portal data response:', response);
        setData(response);
      } catch (err: any) {
        console.error('Failed to fetch trust portal data:', err);
        setError(err.message || 'Failed to load trust portal data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrustPortalData();
  }, [user?.id]);

  const generateInviteLink = async () => {
    if (!user?.id) {
      setError('User ID not available for generating invite link');
      return;
    }

    try {
      setIsGeneratingLink(true);
      console.log('Generating invite link for user:', user.id);
      const response = await vendors.trustPortal.generateInviteLink(user.id);
      console.log('Generated invite link response:', response);
      setInviteLink(response.inviteLink);
    } catch (err: any) {
      console.error('Failed to generate invite link:', err);
      setError(err.message || 'Failed to generate invite link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      // You could add a toast notification here
    }
  };

  const openPublicView = () => {
    if (inviteLink) {
      window.open(inviteLink, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trust portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Trust Portal</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Debug Info:</p>
            <p>User ID: {user?.id || 'Not available'}</p>
            <p>User Role: {user?.role || 'Not available'}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Trust Portal</h1>
                <p className="text-sm text-gray-600">Manage your public compliance portfolio</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!inviteLink && (
                <button
                  onClick={generateInviteLink}
                  disabled={isGeneratingLink}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {isGeneratingLink ? 'Generating...' : 'Generate Share Link'}
                </button>
              )}
              
              {inviteLink && (
                <button
                  onClick={openPublicView}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Portal
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Share Link Section */}
        {inviteLink && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Share Your Trust Portal</h3>
            <p className="text-sm text-blue-700 mb-4">
              Share this link with enterprises to showcase your work without requiring them to sign up.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-blue-300 rounded-md bg-white text-sm"
              />
              <button
                onClick={copyInviteLink}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Trust Portal Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Vendor Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">Company Information</h2>
            </div>
            {data?.vendor ? (
              <div className="space-y-2 text-sm">
                <p><strong>Company:</strong> {data.vendor.companyName || 'Not specified'}</p>
                <p><strong>Industry:</strong> {data.vendor.industry || 'Not specified'}</p>
                <p><strong>Region:</strong> {data.vendor.region || 'Not specified'}</p>
                {data.vendor.website && (
                  <p><strong>Website:</strong> <a href={data.vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{data.vendor.website}</a></p>
                )}
                {data.vendor.description && (
                  <p><strong>Description:</strong> {data.vendor.description}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Company information not available</p>
            )}
          </div>

          {/* Works */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold">Shared Works</h2>
            </div>
            {Array.isArray(data?.works) && data.works.length > 0 ? (
              <div className="space-y-3">
                {safeMap(data.works.slice(0, 3), (work: any, index: number) => (
                  <div key={index} className="border-l-4 border-green-500 pl-3">
                    <h3 className="font-medium text-sm">{work.projectName}</h3>
                    <p className="text-xs text-gray-600">{work.status}</p>
                  </div>
                ))}
                {data.works.length > 3 && (
                  <p className="text-xs text-gray-500">+{data.works.length - 3} more works</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No works shared yet</p>
            )}
          </div>

          {/* Questionnaire Answers */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold">Compliance Answers</h2>
            </div>
            {Array.isArray(data?.questionnaireAnswers) && data.questionnaireAnswers.length > 0 ? (
              <div className="space-y-3">
                {safeMap(data.questionnaireAnswers.slice(0, 3), (answer: any, index: number) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-3">
                    <h3 className="font-medium text-sm">{answer.question}</h3>
                    <p className="text-xs text-gray-600">{answer.answer?.substring(0, 50)}...</p>
                  </div>
                ))}
                {data.questionnaireAnswers.length > 3 && (
                  <p className="text-xs text-gray-500">+{data.questionnaireAnswers.length - 3} more answers</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No compliance answers shared yet</p>
            )}
          </div>
        </div>

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({ user, data, inviteLink }, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}; 