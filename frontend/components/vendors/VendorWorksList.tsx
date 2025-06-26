"use client";

import React, { useState } from 'react';
import { 
  Calendar, 
  Building, 
  Tag, 
  Code, 
  FileText, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Share2,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { safeMap } from '@/lib/utils/arrayUtils';

export interface VendorWork {
  id: string;
  projectName: string;
  description?: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  startDate?: string;
  endDate?: string;
  clientName?: string;
  technologies: string[];
  category?: string;
  shareToTrustPortal: boolean;
  evidenceFiles: string[];
  questionnaireAnswers: string[];
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  lastSavedAt?: string;
}

interface VendorWorksListProps {
  works: VendorWork[];
  onEdit: (work: VendorWork) => void;
  onDelete: (workId: string) => Promise<void>;
  onToggleShare: (workId: string, shareToTrustPortal: boolean) => Promise<void>;
  onGenerateInviteLink?: () => Promise<string>;
  isLoading?: boolean;
}

export const VendorWorksList: React.FC<VendorWorksListProps> = ({
  works,
  onEdit,
  onDelete,
  onToggleShare,
  onGenerateInviteLink,
  isLoading = false
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingShareId, setTogglingShareId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [showInviteLink, setShowInviteLink] = useState(false);

  const handleDelete = async (workId: string) => {
    if (!confirm('Are you sure you want to delete this work submission?')) {
      return;
    }

    try {
      setDeletingId(workId);
      await onDelete(workId);
    } catch (error) {
      console.error('Failed to delete work:', error);
      alert('Failed to delete work. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleShare = async (workId: string, currentShareStatus: boolean) => {
    try {
      setTogglingShareId(workId);
      await onToggleShare(workId, !currentShareStatus);
    } catch (error) {
      console.error('Failed to toggle share status:', error);
      alert('Failed to update share status. Please try again.');
    } finally {
      setTogglingShareId(null);
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!onGenerateInviteLink) return;

    try {
      const link = await onGenerateInviteLink();
      setInviteLink(link);
      setShowInviteLink(true);
    } catch (error) {
      console.error('Failed to generate invite link:', error);
      alert('Failed to generate invite link. Please try again.');
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Planned':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Planned':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Loading works...</span>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No work submissions yet</h3>
        <p className="text-gray-600 mb-4">
          Start by adding your completed projects to showcase your work.
        </p>
      </div>
    );
  }

  const sharedWorks = works.filter(work => work.shareToTrustPortal && !work.isDraft);

  return (
    <div className="space-y-6">
      {/* Trust Portal Section */}
      {sharedWorks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-1">Trust Portal</h3>
              <p className="text-sm text-blue-700">
                {sharedWorks.length} work{sharedWorks.length !== 1 ? 's' : ''} shared on trust portal
              </p>
            </div>
            {onGenerateInviteLink && (
              <button
                onClick={handleGenerateInviteLink}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Generate Invite Link
              </button>
            )}
          </div>

          {showInviteLink && inviteLink && (
            <div className="mt-4 p-3 bg-white border border-blue-200 rounded-md">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Trust Portal Invite Link:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={copyInviteLink}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Share this link with enterprises to showcase your work without requiring them to sign up.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Works List */}
      <div className="grid gap-6">
        {works.map((work) => (
          <div
            key={work.id}
            className={`bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${
              work.isDraft ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {work.projectName}
                  </h3>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(work.status)}`}>
                    {getStatusIcon(work.status)}
                    <span className="ml-1">{work.status}</span>
                  </div>
                  {work.isDraft && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Draft
                    </span>
                  )}
                </div>
                
                {work.description && (
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {work.description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                  {work.clientName && (
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      {work.clientName}
                    </div>
                  )}
                  
                  {work.category && (
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2 text-gray-400" />
                      {work.category}
                    </div>
                  )}
                  
                  {work.startDate && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(work.startDate).toLocaleDateString()}
                    </div>
                  )}
                  
                  {Array.isArray(work.technologies) && work.technologies.length > 0 && (
                    <div className="flex items-center">
                      <Code className="h-4 w-4 mr-2 text-gray-400" />
                      {work.technologies.slice(0, 2).join(', ')}
                      {work.technologies.length > 2 && ` +${work.technologies.length - 2}`}
                    </div>
                  )}
                </div>

                                  {Array.isArray(work.technologies) && work.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {safeMap(work.technologies, (tech: string, index) => (
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

              <div className="flex items-center space-x-2 ml-4">
                {/* Share Toggle */}
                <button
                  onClick={() => handleToggleShare(work.id, work.shareToTrustPortal)}
                  disabled={togglingShareId === work.id || work.isDraft}
                  className={`p-2 rounded-md transition-colors ${
                    work.shareToTrustPortal
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  } ${work.isDraft ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={work.isDraft ? 'Complete the work to share on trust portal' : work.shareToTrustPortal ? 'Shared on trust portal' : 'Share on trust portal'}
                >
                  {togglingShareId === work.id ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : work.shareToTrustPortal ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => onEdit(work)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                  title="Edit work"
                >
                  <Edit className="h-4 w-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(work.id)}
                  disabled={deletingId === work.id}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                  title="Delete work"
                >
                  {deletingId === work.id ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Last Saved Info */}
            {work.lastSavedAt && work.isDraft && (
              <div className="text-xs text-gray-500 mt-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Last saved: {new Date(work.lastSavedAt).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 