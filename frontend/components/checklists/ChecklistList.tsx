import React from 'react';
import { FileText, CheckCircle, AlertTriangle, Clock, Trash2, Eye } from 'lucide-react';
import { Checklist } from '@/lib/services/checklistService';
import { safeMap } from '@/lib/utils/arrayUtils';

interface ChecklistListProps {
  checklists: Checklist[];
  onViewChecklist?: (checklist: Checklist) => void;
  onDeleteChecklist?: (checklist: Checklist) => void;
  loading?: boolean;
}

export const ChecklistList: React.FC<ChecklistListProps> = ({
  checklists,
  onViewChecklist,
  onDeleteChecklist,
  loading = false,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'extracting':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      case 'extracting':
        return 'Extracting...';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'extracting':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!checklists || checklists.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No checklists uploaded
        </h3>
        <p className="text-gray-500">
          Upload your first compliance checklist to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {safeMap(checklists, (checklist: Checklist) => (
        <div
          key={checklist.id}
          className="bg-white rounded-lg border hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {checklist.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(checklist.extractionStatus)}`}
                    >
                      {getStatusIcon(checklist.extractionStatus)}
                      <span className="ml-1">{getStatusText(checklist.extractionStatus)}</span>
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{checklist.originalFilename}</span>
                    {checklist.fileSize && (
                      <span>• {formatFileSize(checklist.fileSize)}</span>
                    )}
                    <span>• {formatDate(checklist.uploadDate)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {checklist.questionCount}
                  </div>
                  <div className="text-sm text-gray-500">
                    {checklist.questionCount === 1 ? 'question' : 'questions'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {onViewChecklist && (
                    <button
                      onClick={() => onViewChecklist(checklist)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      title="View checklist details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  )}
                  
                  {onDeleteChecklist && (
                    <button
                      onClick={() => onDeleteChecklist(checklist)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete checklist"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {checklist.extractionStatus === 'error' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">
                      Extraction Failed
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      There was an error processing this checklist. Please try uploading again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {checklist.extractionStatus === 'completed' && checklist.questionCount > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Successfully extracted {checklist.questionCount} questions. 
                      Questions are now available in the AI Questionnaire section.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 