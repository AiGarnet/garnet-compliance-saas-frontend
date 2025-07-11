import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Eye, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EvidenceFile {
  id?: string;
  file: File;
  description?: string;
  category?: string;
  preview?: string;
  status: 'pending' | 'approved' | 'saved';
}

interface EvidenceFilePreviewProps {
  files: EvidenceFile[];
  isOpen: boolean;
  onClose: () => void;
  onApprove: (files: EvidenceFile[]) => Promise<void>;
  onReject: (fileId: string) => void;
  isProcessing?: boolean;
}

export function EvidenceFilePreview({
  files,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing = false
}: EvidenceFilePreviewProps) {
  const [fileStatuses, setFileStatuses] = useState<{ [key: string]: 'pending' | 'approved' | 'rejected' }>({});
  const [textPreviews, setTextPreviews] = useState<{ [key: string]: string }>({});
  const [loadingPreviews, setLoadingPreviews] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen && files.length > 0) {
      // Initialize file statuses
      const initialStatuses: { [key: string]: 'pending' | 'approved' | 'rejected' } = {};
      files.forEach((file, index) => {
        const fileKey = file.id || `file-${index}`;
        initialStatuses[fileKey] = 'pending';
      });
      setFileStatuses(initialStatuses);

      // Load text previews for text files
      loadTextPreviews();
    }
  }, [isOpen, files]);

  const loadTextPreviews = async () => {
    const textFiles = files.filter(file => 
      file.file.type === 'text/plain' || 
      file.file.name.toLowerCase().endsWith('.txt') ||
      file.file.name.toLowerCase().endsWith('.md')
    );

    for (const file of textFiles) {
      const fileKey = file.id || `file-${files.indexOf(file)}`;
      setLoadingPreviews(prev => ({ ...prev, [fileKey]: true }));

      try {
        const text = await readFileAsText(file.file);
        setTextPreviews(prev => ({ 
          ...prev, 
          [fileKey]: text.substring(0, 1000) + (text.length > 1000 ? '...' : '') 
        }));
      } catch (error) {
        console.error('Error reading file:', error);
      } finally {
        setLoadingPreviews(prev => ({ ...prev, [fileKey]: false }));
      }
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('text')) return '📝';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('image')) return '🖼️';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    return '📄';
  };

  const handleFileAction = (fileIndex: number, action: 'approve' | 'reject') => {
    const fileKey = files[fileIndex].id || `file-${fileIndex}`;
    setFileStatuses(prev => ({ ...prev, [fileKey]: action === 'approve' ? 'approved' : 'rejected' }));
  };

  const handleApproveAll = async () => {
    const approvedFiles = files.filter((file, index) => {
      const fileKey = file.id || `file-${index}`;
      return fileStatuses[fileKey] === 'approved';
    });

    if (approvedFiles.length === 0) {
      alert('Please approve at least one file before proceeding.');
      return;
    }

    await onApprove(approvedFiles);
  };

  const allFilesReviewed = files.every((file, index) => {
    const fileKey = file.id || `file-${index}`;
    return fileStatuses[fileKey] !== 'pending';
  });

  const approvedCount = Object.values(fileStatuses).filter(status => status === 'approved').length;
  const rejectedCount = Object.values(fileStatuses).filter(status => status === 'rejected').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Review Evidence Files</h2>
              <p className="text-blue-100 mt-1">
                Please review and approve the files before saving to secure storage
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isProcessing}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Status Summary */}
          {files.length > 0 && (
            <div className="mt-4 flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span>Approved: {approvedCount}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                <span>Rejected: {rejectedCount}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                <span>Pending: {files.length - approvedCount - rejectedCount}</span>
              </div>
            </div>
          )}
        </div>

        {/* File List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {files.map((file, index) => {
              const fileKey = file.id || `file-${index}`;
              const status = fileStatuses[fileKey] || 'pending';
              const textPreview = textPreviews[fileKey];
              const isLoadingPreview = loadingPreviews[fileKey];

              return (
                <div
                  key={fileKey}
                  className={`border rounded-lg p-4 transition-all ${
                    status === 'approved' 
                      ? 'border-green-500 bg-green-50' 
                      : status === 'rejected' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* File Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-2xl">{getFileIcon(file.file)}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {file.file.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                          <span>{formatFileSize(file.file.size)}</span>
                          <span>•</span>
                          <span>{file.file.type || 'Unknown type'}</span>
                        </div>
                        {file.description && (
                          <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                        )}
                        {file.category && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                            {file.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center space-x-2">
                      {status === 'approved' && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Approved</span>
                        </div>
                      )}
                      {status === 'rejected' && (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Rejected</span>
                        </div>
                      )}
                      {status === 'pending' && (
                        <div className="flex items-center text-yellow-600">
                          <AlertCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Pending Review</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Text Preview for text files */}
                  {(file.file.type === 'text/plain' || file.file.name.toLowerCase().endsWith('.txt')) && (
                    <div className="mb-3">
                      {isLoadingPreview ? (
                        <div className="flex items-center justify-center py-4 bg-gray-50 rounded">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-600">Loading preview...</span>
                        </div>
                      ) : textPreview ? (
                        <div className="bg-gray-50 border rounded p-3">
                          <div className="text-xs text-gray-500 mb-2 flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            File Preview
                          </div>
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto">
                            {textPreview}
                          </pre>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border rounded p-3 text-center text-gray-500 text-sm">
                          Unable to load preview
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleFileAction(index, 'reject')}
                      disabled={isProcessing}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        status === 'rejected'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleFileAction(index, 'approve')}
                      disabled={isProcessing}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        status === 'approved'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {allFilesReviewed ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  All files reviewed
                </span>
              ) : (
                <span>Please review all files before proceeding</span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveAll}
                disabled={!allFilesReviewed || approvedCount === 0 || isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Approved Files ({approvedCount})</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 