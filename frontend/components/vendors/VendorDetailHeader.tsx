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
}

export function VendorDetailHeader({ vendor, onEdit }: VendorDetailHeaderProps) {
  const router = useRouter();
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setIsShareDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getVendorStatus = () => {
    if (!vendor) return { status: 'Unknown', color: 'bg-gray-50 text-gray-600 border-gray-200' };
    
    switch (vendor.status) {
      case 'Questionnaire Pending':
        return { status: 'Questionnaire Pending', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
      case 'In Review':
        return { status: 'In Review', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'Pending Review':
        return { status: 'Pending Review', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'Approved':
        return { status: 'Approved', color: 'bg-green-50 text-green-700 border-green-200' };
      default:
        return { status: vendor.status || 'Unknown', color: 'bg-gray-50 text-gray-600 border-gray-200' };
    }
  };

  const handleShareVendor = () => {
    const vendorUrl = `${window.location.origin}/vendors/${vendor.id}`;
    navigator.clipboard.writeText(vendorUrl);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      // TODO: Implement report generation
      console.log('Report generation not yet implemented');
      alert('Report generation feature is coming soon!');
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleViewTrustPortal = () => {
    router.push(`/trust-portal?vendor=${vendor.id}`);
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getVendorStatus().color}`}>
                        {getVendorStatus().status}
                      </span>
                      
                      {vendor.industry && (
                        <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          {vendor.industry}
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
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit Vendor
                </button>

                <div className="relative" ref={shareDropdownRef}>
                  <button
                    onClick={() => setIsShareDropdownOpen(!isShareDropdownOpen)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>

                  {isShareDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={handleShareVendor}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {shareSuccess ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          {shareSuccess ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button
                          onClick={() => window.open(`/vendors/${vendor.id}`, '_blank')}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open in New Tab
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown className="h-4 w-4" />
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </button>
              </div>

              <div className="relative" ref={moreDropdownRef}>
                <button
                  onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {isMoreDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={handleViewTrustPortal}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        View in Trust Portal
                      </button>
                      <button
                        onClick={() => router.push(`/vendors/${vendor.id}/settings`)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Vendor Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 