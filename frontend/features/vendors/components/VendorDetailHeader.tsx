"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit, Download, FileDown, FileText, Share2, Copy, ExternalLink, Check, MoreVertical, Eye, Settings } from 'lucide-react';
import Link from 'next/link';
import { VendorDetail } from '@/hooks/useVendor';
import { Tooltip } from '@/components/ui/Tooltip';
import { useRouter } from 'next/navigation';
import { vendors } from '@/lib/api';

interface VendorDetailHeaderProps {
  vendor: VendorDetail;
  onEdit?: () => void;
  riskAssessment?: any;
  isCalculatingRisk?: boolean;
}

export function VendorDetailHeader({ vendor, onEdit, riskAssessment, isCalculatingRisk }: VendorDetailHeaderProps) {
  const router = useRouter();
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleManageWorks = () => {
    router.push(`/vendor-works?id=${vendor.id}`);
  };

  const handleViewTrustPortal = () => {
    router.push('/trust-portal');
  };

  const generateInviteLink = async () => {
    try {
      setIsGeneratingLink(true);
      const response = await vendors.trustPortal.generateInviteLink(vendor.id);
      setInviteLink(response.inviteLink);
      setShowInviteModal(true);
      setShowDropdown(false);
    } catch (err: any) {
      console.error('Failed to generate invite link:', err);
      alert('Failed to generate invite link. Please try again.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const openPublicView = () => {
    if (inviteLink) {
      window.open(inviteLink, '_blank');
    }
  };

  // Calculate dynamic status based on questionnaire completion
  const getVendorStatus = () => {
    const questionnaireAnswers = vendor.questionnaireAnswers || [];
    const totalQuestions = questionnaireAnswers.length;
    const completedQuestions = questionnaireAnswers.filter(qa => qa.status === 'Completed').length;
    
    if (totalQuestions === 0) {
      return { status: 'No Questionnaire', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
    
    if (completedQuestions === totalQuestions) {
      return { status: 'Questionnaire Completed', color: 'bg-green-50 text-green-700 border-green-200' };
    }
    
    if (completedQuestions > 0) {
      return { status: 'Questionnaire In Progress', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    }
    
    return { status: 'Questionnaire Pending', color: 'bg-red-50 text-red-700 border-red-200' };
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          {/* Top section with back button and vendor info */}
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-center">
              <Link 
                href="/vendors" 
                className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" 
                aria-label="Back to vendor list"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Link>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
                    <div className="mt-2 flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getVendorStatus().color}`}>
                        {getVendorStatus().status}
                      </span>
                      
                      {vendor.industry && (
                        <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          {vendor.industry}
                        </span>
                      )}
                      
                      {(riskAssessment?.riskLevel || vendor.riskLevel) && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium
                          ${(riskAssessment?.riskLevel || vendor.riskLevel) === 'Low' ? 'bg-green-50 text-green-700' : 
                            (riskAssessment?.riskLevel || vendor.riskLevel) === 'Medium' ? 'bg-yellow-50 text-yellow-700' : 
                            'bg-red-50 text-red-700'}`}
                        >
                          {isCalculatingRisk ? 'Calculating...' : `${riskAssessment?.riskLevel || vendor.riskLevel} Risk`}
                          {riskAssessment?.overallScore && ` (${riskAssessment.overallScore})`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons section */}
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Primary Actions */}
                <button
                  onClick={generateInviteLink}
                  disabled={isGeneratingLink}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {isGeneratingLink ? 'Generating...' : 'Share Trust Portal'}
                </button>

                <button
                  onClick={handleManageWorks}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Works
                </button>

                <button
                  onClick={handleViewTrustPortal}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Trust Portal
                </button>
              </div>

              {/* More Actions Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      {onEdit ? (
                        <button
                          onClick={() => {
                            onEdit();
                            setShowDropdown(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-3" />
                          Edit Vendor
                        </button>
                      ) : (
                        <button
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                          disabled
                        >
                          <Edit className="h-4 w-4 mr-3" />
                          Edit Vendor (Coming Soon)
                        </button>
                      )}
                      
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                        disabled
                      >
                        <Download className="h-4 w-4 mr-3" />
                        Download Report (Coming Soon)
                      </button>
                      
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                        disabled
                      >
                        <FileDown className="h-4 w-4 mr-3" />
                        Export Answers (Coming Soon)
                      </button>
                      
                      <hr className="my-1" />
                      
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                        disabled
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings (Coming Soon)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Share2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Trust Portal Invite Link</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Share this link with external parties to showcase <strong>{vendor.name}'s</strong> compliance portfolio. 
              No registration required for viewers.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shareable Link:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={copyInviteLink}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={openPublicView}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Trust Portal
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 <strong>Tip:</strong> This link expires in 30 days. You can generate a new one anytime.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
