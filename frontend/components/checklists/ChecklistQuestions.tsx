import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Bot, 
  Upload, 
  FileText,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { ChecklistQuestion, SupportingDocument } from '@/lib/services/checklistService';
import { safeMap } from '@/lib/utils/arrayUtils';

interface ChecklistQuestionsProps {
  questions: ChecklistQuestion[];
  onUpdateQuestion?: (questionId: string, updates: any) => void;
  onUploadDocument?: (questionId: string, file: File) => void;
  onGenerateAnswers?: () => void;
  loading?: boolean;
  generatingAnswers?: boolean;
}

export const ChecklistQuestions: React.FC<ChecklistQuestionsProps> = ({
  questions,
  onUpdateQuestion,
  onUploadDocument,
  onGenerateAnswers,
  loading = false,
  generatingAnswers = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'needs-support':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'needs-support':
        return 'Needs Support';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending AI Answer';
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'needs-support':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleFileSelect = (questionId: string, file: File) => {
    setSelectedFiles(prev => ({ ...prev, [questionId]: file }));
  };

  const handleUploadDocument = (questionId: string) => {
    const file = selectedFiles[questionId];
    if (file && onUploadDocument) {
      onUploadDocument(questionId, file);
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[questionId];
        return newFiles;
      });
    }
  };

  const pendingQuestions = questions.filter(q => q.status === 'pending').length;
  const completedQuestions = questions.filter(q => q.status === 'completed').length;
  const supportNeededQuestions = questions.filter(q => q.status === 'needs-support').length;

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No questions available
        </h3>
        <p className="text-gray-500">
          Upload a checklist to extract questions and generate AI answers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Questions Overview
          </h3>
          {pendingQuestions > 0 && onGenerateAnswers && (
            <button
              onClick={onGenerateAnswers}
              disabled={generatingAnswers}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingAnswers ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bot className="h-4 w-4 mr-2" />
              )}
              {generatingAnswers ? 'Generating...' : `Generate AI Answers (${pendingQuestions})`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{questions.length}</div>
            <div className="text-sm text-gray-500">Total Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedQuestions}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingQuestions}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{supportNeededQuestions}</div>
            <div className="text-sm text-gray-500">Need Support</div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {safeMap(questions, (question: ChecklistQuestion) => (
          <div
            key={question.id}
            className="bg-white rounded-lg border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      #{question.questionOrder}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(question.status)}`}
                    >
                      {getStatusIcon(question.status)}
                      <span className="ml-1">{getStatusText(question.status)}</span>
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {question.questionText}
                  </h4>
                </div>
              </div>

              {/* AI Answer */}
              {question.aiAnswer && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-blue-900">Compliance Response</h5>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          AI Generated
                        </span>
                      </div>
                      <div className="text-sm text-blue-800 prose prose-blue prose-sm max-w-none">
                        {question.aiAnswer.split('\n').map((line, index) => (
                          <p key={index} className="mb-2 last:mb-0">
                            {line.split(/(\*\*.*?\*\*)/).map((part, partIndex) => 
                              part.startsWith('**') && part.endsWith('**') ? (
                                <strong key={partIndex} className="font-semibold">
                                  {part.slice(2, -2)}
                                </strong>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Requirement */}
              {question.requiresDocument && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-yellow-900 mb-1">
                        Supporting Document Required
                      </h5>
                      {question.documentDescription && (
                        <p className="text-sm text-yellow-800 mb-3">
                          {question.documentDescription}
                        </p>
                      )}
                      
                      {/* File Upload */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          id={`file-${question.id}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(question.id, file);
                          }}
                        />
                        <label
                          htmlFor={`file-${question.id}`}
                          className="inline-flex items-center px-3 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 cursor-pointer"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </label>
                        
                        {selectedFiles[question.id] && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-yellow-700">
                              {selectedFiles[question.id].name}
                            </span>
                            <button
                              onClick={() => handleUploadDocument(question.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                            >
                              Upload
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Supporting Documents */}
              {question.supportingDocuments && question.supportingDocuments.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-sm font-medium text-gray-900 mb-2">
                    Supporting Documents:
                  </h6>
                  <div className="space-y-2">
                    {safeMap(question.supportingDocuments, (doc: SupportingDocument) => (
                      <div
                        key={doc.id}
                        className="flex items-center space-x-2 text-sm text-gray-600"
                      >
                        <FileText className="h-4 w-4" />
                        <span>{doc.filename}</span>
                        <span className="text-gray-400">
                          ({new Date(doc.uploadedAt).toLocaleDateString()})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                {question.status === 'needs-support' && (
                  <button
                    onClick={() => onUpdateQuestion?.(question.id, { status: 'pending' })}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Retry AI Generation
                  </button>
                )}
                
                {question.status === 'completed' && (
                  <button
                    onClick={() => onUpdateQuestion?.(question.id, { status: 'pending' })}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Regenerate Answer
                  </button>
                )}
                
                <span className="text-sm text-gray-500">
                  Updated: {new Date(question.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 