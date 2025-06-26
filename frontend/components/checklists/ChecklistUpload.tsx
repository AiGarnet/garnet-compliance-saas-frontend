import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { ChecklistService, Checklist, ChecklistQuestion } from '@/lib/services/checklistService';

interface ChecklistUploadProps {
  vendorId: string;
  onUploadComplete?: (checklist: Checklist, questions: ChecklistQuestion[]) => void;
  onError?: (error: string) => void;
}

interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  status: 'idle' | 'uploading' | 'extracting' | 'completed' | 'error';
  error: string | null;
  result: { checklist: Checklist; questions: ChecklistQuestion[] } | null;
}

export const ChecklistUpload: React.FC<ChecklistUploadProps> = ({
  vendorId,
  onUploadComplete,
  onError,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    status: 'idle',
    error: null,
    result: null,
  });

  const [dragActive, setDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      const error = 'Please upload a PDF, TXT, DOC, or DOCX file.';
      setUploadState(prev => ({ ...prev, error, status: 'error' }));
      onError?.(error);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const error = 'File size must be less than 10MB.';
      setUploadState(prev => ({ ...prev, error, status: 'error' }));
      onError?.(error);
      return;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      error: null,
      status: 'idle',
    }));
  }, [onError]);

  const handleUpload = async () => {
    if (!uploadState.file || !vendorId) return;

    setUploadState(prev => ({
      ...prev,
      uploading: true,
      status: 'uploading',
      progress: 10,
      error: null,
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadState(prev => {
          if (prev.progress < 90) {
            return { ...prev, progress: prev.progress + 10 };
          }
          return prev;
        });
      }, 500);

      // Update status to extracting
      setTimeout(() => {
        setUploadState(prev => ({
          ...prev,
          status: 'extracting',
          progress: 95,
        }));
      }, 2000);

      // Upload the file
      const result = await ChecklistService.uploadChecklist(
        uploadState.file,
        vendorId,
        uploadState.file.name
      );

      clearInterval(progressInterval);

      setUploadState(prev => ({
        ...prev,
        uploading: false,
        status: 'completed',
        progress: 100,
        result,
      }));

      onUploadComplete?.(result.checklist, result.questions);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        status: 'error',
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  };

  const resetUpload = () => {
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      status: 'idle',
      error: null,
      result: null,
    });
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'extracting':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      default:
        return <Upload className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (uploadState.status) {
      case 'uploading':
        return 'Uploading file...';
      case 'extracting':
        return 'Extracting questions...';
      case 'completed':
        return `Successfully extracted ${uploadState.result?.questions.length || 0} questions!`;
      case 'error':
        return uploadState.error || 'Upload failed';
      default:
        return 'Drag and drop your checklist file here, or click to browse';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${uploadState.status === 'error' ? 'border-red-300 bg-red-50' : ''}
          ${uploadState.status === 'completed' ? 'border-green-300 bg-green-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="checklist-upload"
          className="hidden"
          accept=".pdf,.txt,.doc,.docx"
          onChange={handleFileInputChange}
          disabled={uploadState.uploading}
        />

        <div className="space-y-4">
          {getStatusIcon()}
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {getStatusMessage()}
            </p>
            
            {uploadState.file && (
              <div className="mt-2 flex items-center justify-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{uploadState.file.name}</span>
                {uploadState.status === 'idle' && (
                  <button
                    onClick={resetUpload}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {uploadState.uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          )}

          {uploadState.status === 'idle' && uploadState.file && (
            <button
              onClick={handleUpload}
              disabled={!vendorId}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload & Extract Questions
            </button>
          )}

          {uploadState.status === 'idle' && !uploadState.file && (
            <label
              htmlFor="checklist-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </label>
          )}

          {uploadState.status === 'completed' && (
            <button
              onClick={resetUpload}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upload Another File
            </button>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Supported formats: PDF, TXT, DOC, DOCX (max 10MB)
        </div>
      </div>

      {uploadState.result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-2">
            Upload Successful!
          </h3>
          <div className="text-sm text-green-700 space-y-1">
            <p>• Checklist: {uploadState.result.checklist.name}</p>
            <p>• Questions extracted: {uploadState.result.questions.length}</p>
            <p>• Status: {uploadState.result.checklist.extractionStatus}</p>
          </div>
        </div>
      )}
    </div>
  );
}; 