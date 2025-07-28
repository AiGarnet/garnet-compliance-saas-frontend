import React, { useState, useEffect } from 'react';
import { X, FileText, Check, Search, Filter, AlertCircle } from 'lucide-react';

interface EvidenceFile {
  id: string;
  originalFilename: string;
  description?: string;
  category?: string;
  fileType: string;
  fileSize: number;
  fileContent?: string;
  uploadDate: string;
}

interface EvidenceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFileIds: string[]) => void;
  evidenceFiles: EvidenceFile[];
  question?: string;
  isLoading?: boolean;
}

export const EvidenceSelectionModal: React.FC<EvidenceSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  evidenceFiles,
  question,
  isLoading = false
}) => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFileIds([]);
      setSearchTerm('');
      setFilterCategory('all');
    }
  }, [isOpen]);

  // Filter evidence files based on search and category
  const filteredFiles = evidenceFiles.filter(file => {
    const matchesSearch = !searchTerm || 
      file.originalFilename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || file.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(evidenceFiles.map(f => f.category).filter(Boolean))) as string[];

  const handleFileToggle = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map(f => f.id));
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedFileIds);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Select Evidence Files for AI Response
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose which evidence files should be used to enhance the AI response generation
            </p>
            {question && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Question:</strong> {question.substring(0, 150)}{question.length > 150 ? '...' : ''}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by filename, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {selectedFileIds.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Selected count */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredFiles.length} files available • {selectedFileIds.length} selected
            </p>
            {selectedFileIds.length > 0 && (
              <div className="text-sm text-green-600 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                {selectedFileIds.length} file{selectedFileIds.length > 1 ? 's' : ''} will enhance the AI response
              </div>
            )}
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto max-h-96 p-6">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {evidenceFiles.length === 0 
                  ? 'No evidence files found for this vendor'
                  : 'No files match your search criteria'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedFileIds.includes(file.id)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleFileToggle(file.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 ${
                        selectedFileIds.includes(file.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {selectedFileIds.includes(file.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <h3 className="font-medium text-gray-900 truncate">
                            {file.originalFilename}
                          </h3>
                        </div>
                        
                        {file.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>{formatDate(file.uploadDate)}</span>
                          {file.category && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {file.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center text-sm text-gray-600">
            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
            Selected files will be analyzed to provide more accurate and contextual responses
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>Continue with {selectedFileIds.length} file{selectedFileIds.length !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 