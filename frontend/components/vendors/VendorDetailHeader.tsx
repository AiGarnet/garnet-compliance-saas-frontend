"use client";

import React, { useState } from 'react';
import { ArrowLeft, Edit, Download, FileDown, FileText, Share2, Copy, ExternalLink, Check } from 'lucide-react';
import Link from 'next/link';
import { VendorDetail } from '@/hooks/useVendor';
import { Tooltip } from '@/components/ui/Tooltip';
import { useRouter } from 'next/navigation';
import { vendors } from '@/lib/api';

interface VendorDetailHeaderProps {
  vendor: VendorDetail;
  onEdit?: () => void;
}

export function VendorDetailHeader({ vendor, onEdit }: VendorDetailHeaderProps) {
  const router = useRouter();
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleManageWorks = () => {
    router.push(`/vendor-works?id=${vendor.id}`);
  };

  const generateInviteLink = async () => {
    try {
      setIsGeneratingLink(true);
      const response = await vendors.trustPortal.generateInviteLink(vendor.id);
      setInviteLink(response.inviteLink);
      setShowInviteModal(true);
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

  return (
    <>
      <div className="bg-white border-b border-gray-200 shadow-sm py-6 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start md:items-center">
              <Link 
                href="/vendors" 
                className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-blue-50 transition-colors" 
                aria-label="Back to vendor list"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
                <span className="sr-only">Back to vendor list</span>
              </Link>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
                <div className="mt-1 flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                    vendor.status === 'Approved' ? 'bg-success-light text-success border-success' :
                    vendor.status === 'In Review' ? 'bg-warning-light text-warning border-warning' :
                    vendor.status === 'Questionnaire Pending' ? 'bg-secondary-light text-secondary border-secondary' :
                    'bg-gray-100 text-gray-700 border-gray-300'
                  }`}>
                    {vendor.status}
                  </span>
                  
                  {vendor.industry && (
                    <span className="text-sm text-gray-500">{vendor.industry}</span>
                  )}
                  {vendor.riskLevel && (
                    <span className={`text-sm px-2 py-1 rounded-full 
                      ${vendor.riskLevel === 'Low' ? 'bg-success-light text-success' : 
                        vendor.riskLevel === 'Medium' ? 'bg-warning-light text-warning' : 
                        'bg-danger-light text-danger'}`}
                    >
                      {vendor.riskLevel} Risk
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Invite to Trust Portal Button */}
              <button
                onClick={generateInviteLink}
                disabled={isGeneratingLink}
                className="px-4 py-2 rounded-md bg-green-600 text-white flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Share2 className="h-4 w-4" />
                <span>{isGeneratingLink ? 'Generating...' : 'Invite to Trust Portal'}</span>
              </button>

              {/* Manage Works Button */}
              <button
                onClick={handleManageWorks}
                className="px-4 py-2 rounded-md bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Manage Works</span>
              </button>

              {onEdit ? (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 rounded-md bg-primary text-white flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <Tooltip content="Coming Soon">
                  <button
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 flex items-center gap-2 hover:bg-blue-50 transition-colors opacity-60 cursor-not-allowed"
                    disabled
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                </Tooltip>
              )}
              
              <Tooltip content="Coming Soon">
                <button
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 flex items-center gap-2 hover:bg-blue-50 transition-colors opacity-60 cursor-not-allowed"
                  disabled
                >
                  <Download className="h-4 w-4" />
                  <span>Download Report</span>
                </button>
              </Tooltip>
              
              <Tooltip content="Coming Soon">
                <button
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 flex items-center gap-2 hover:bg-blue-50 transition-colors opacity-60 cursor-not-allowed"
                  disabled
                >
                  <FileDown className="h-4 w-4" />
                  <span>Export Answers</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Trust Portal Invite Link</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this link with external parties to showcase {vendor.name}'s compliance portfolio without requiring them to sign up.
            </p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <button
                onClick={copyInviteLink}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={openPublicView}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Trust Portal
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 