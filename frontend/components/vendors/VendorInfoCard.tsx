"use client";

import React from 'react';
import { Building2, Mail, Globe, Calendar, User } from 'lucide-react';
import { VendorDetail } from '@/hooks/useVendor';

interface VendorInfoCardProps {
  vendor: VendorDetail;
  className?: string;
}

export function VendorInfoCard({ vendor, className = '' }: VendorInfoCardProps) {
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Vendor Information</h3>
            <p className="text-sm text-gray-500">Company details and contact information</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Contact Information */}
        <div className="space-y-3">
          {vendor.contactEmail && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Email</span>
                <p className="text-sm font-medium text-gray-900">{vendor.contactEmail}</p>
              </div>
            </div>
          )}

          {vendor.contactName && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Contact Person</span>
                <p className="text-sm font-medium text-gray-900">{vendor.contactName}</p>
              </div>
            </div>
          )}

          {vendor.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Website</span>
                <a 
                  href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {vendor.website}
                </a>
              </div>
            </div>
          )}

          {vendor.industry && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Industry</span>
                <p className="text-sm font-medium text-gray-900">{vendor.industry}</p>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <hr className="border-gray-200" />

        {/* Timeline Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <span className="text-sm text-gray-600">Created</span>
              <p className="text-sm font-medium text-gray-900">{formatDate(vendor.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <span className="text-sm text-gray-600">Last Updated</span>
              <p className="text-sm font-medium text-gray-900">{formatDate(vendor.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {vendor.description && (
          <>
            <hr className="border-gray-200" />
            <div>
              <span className="text-sm text-gray-600">Description</span>
              <p className="text-sm text-gray-900 mt-1 leading-relaxed">{vendor.description}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 