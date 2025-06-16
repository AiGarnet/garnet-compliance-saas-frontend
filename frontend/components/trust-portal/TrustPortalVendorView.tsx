'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Shield, FileText, Share2, Copy, ExternalLink } from 'lucide-react';
import { vendors } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';

export const TrustPortalVendorView: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    const fetchTrustPortalData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError('');
        
        // Get trust portal data for the authenticated vendor
        const response = await vendors.trustPortal.getData(user.id);
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
    if (!user?.id) return;

    try {
      setIsGeneratingLink(true);
      const response = await vendors.trustPortal.generateInviteLink(user.id);
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
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
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

        {data && (
          <>
            {/* Vendor Profile Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <div className="flex items-center mb-4">
                <Building2 className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Your Company Profile</h2>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {data.vendor?.companyName || 'Your Company'}
              </h3>
              
              {data.vendor?.description && (
                <p className="text-sm text-gray-600 mb-4">{data.vendor.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {data.vendor?.region && (
                  <div>
                    <span className="font-medium text-gray-700">Region:</span>
                    <span className="ml-2 text-gray-600">{data.vendor.region}</span>
                  </div>
                )}
                {data.vendor?.industry && (
                  <div>
                    <span className="font-medium text-gray-700">Industry:</span>
                    <span className="ml-2 text-gray-600">{data.vendor.industry}</span>
                  </div>
                )}
                {data.vendor?.website && (
                  <div>
                    <span className="font-medium text-gray-700">Website:</span>
                    <a 
                      href={data.vendor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      {data.vendor.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Work Portfolio Section */}
            {data.works && data.works.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <div className="flex items-center mb-6">
                  <FileText className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Shared Work Portfolio</h2>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {data.works.length} work{data.works.length !== 1 ? 's' : ''} shared
                  </span>
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
                      
                      {work.clientName && (
                        <p className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">Client:</span> {work.clientName}
                        </p>
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
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Shared Work Yet</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't shared any work to your trust portal yet. 
                  </p>
                  <p className="text-sm text-gray-500">
                    Go to your dashboard to create and share work submissions.
                  </p>
                </div>
              </div>
            )}

            {/* Questionnaire Answers Section */}
            {data.questionnaireAnswers && data.questionnaireAnswers.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-6">
                  <Shield className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Shared Compliance Responses</h2>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {data.questionnaireAnswers.length} response{data.questionnaireAnswers.length !== 1 ? 's' : ''} shared
                  </span>
                </div>
                
                <div className="space-y-4">
                  {data.questionnaireAnswers.map((answer: any) => (
                    <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{answer.question}</h4>
                      <p className="text-gray-600 text-sm">{answer.answer}</p>
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