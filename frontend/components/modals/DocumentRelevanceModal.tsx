"use client";

import React from 'react';
import { X, AlertTriangle, CheckCircle, FileText, Brain, Target } from 'lucide-react';

interface DocumentRelevanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  relevanceResult: {
    relevanceScore: number;
    isRelevant: boolean;
    message: string;
    extractedContent: string;
    questionText: string;
  };
  fileName: string;
}

export const DocumentRelevanceModal: React.FC<DocumentRelevanceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  relevanceResult,
  fileName
}) => {
  if (!isOpen) return null;

  const { relevanceScore, isRelevant, message } = relevanceResult;
  const scorePercentage = Math.round(relevanceScore * 100);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 75) return 'bg-green-100 border-green-200';
    if (score >= 50) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Document Relevance Check
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Document</span>
            </div>
            <p className="text-sm text-gray-700 font-mono bg-white px-3 py-2 rounded border">
              {fileName}
            </p>
          </div>

          {/* Relevance Score */}
          <div className={`rounded-lg p-4 border-2 ${getScoreBackground(scorePercentage)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span className="font-medium">Relevance Score</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(scorePercentage)}`}>
                {scorePercentage}%
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  scorePercentage >= 75 
                    ? 'bg-green-500' 
                    : scorePercentage >= 50 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-gray-600">
              Threshold: 75% required for automatic approval
            </div>
          </div>

          {/* Result Status */}
          <div className="flex items-start space-x-3">
            {isRelevant ? (
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`font-medium mb-2 ${isRelevant ? 'text-green-800' : 'text-amber-800'}`}>
                {isRelevant ? 'Document Approved' : 'Document Needs Review'}
              </h3>
              <div className="text-sm text-gray-700 leading-relaxed">
                {message.split('.').map((sentence, index) => {
                  if (sentence.trim()) {
                    return (
                      <p key={index} className="mb-1">
                        {sentence.trim().replace(/^[❌✅🔍📄🎯📊💡⚠️]/g, '').trim()}.
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {/* Question Context */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Question Context</h4>
            <p className="text-sm text-blue-800 italic">
              "{relevanceResult.questionText}"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {isRelevant ? (
              <>
                <button
                  onClick={onConfirm}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Proceed with Upload</span>
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 sm:flex-none bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onCancel}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="h-5 w-5" />
                  <span>Choose Different Document</span>
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 sm:flex-none bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>Upload Anyway</span>
                </button>
              </>
            )}
          </div>

          {/* Warning for low relevance */}
          {!isRelevant && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <strong>Recommendation:</strong> For better compliance results, consider uploading a document that more closely matches the question requirements. This will help ensure accurate assessment and faster review processes.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};