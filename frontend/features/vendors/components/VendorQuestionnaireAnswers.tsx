"use client";

import React, { useState } from 'react';
import { VendorDetail } from '@/hooks/useVendor';
import { FileText, MessageSquare, CheckCircle, Clock, PlayCircle, Share2 } from 'lucide-react';
import { TrustPortalRepository } from '@/lib/repositories/trustPortalRepository';
import { Button } from '@/components/ui/button';
import { vendors as vendorAPI } from '@/lib/api';

interface VendorQuestionnaireAnswersProps {
  vendor: VendorDetail;
}

export function VendorQuestionnaireAnswers({ vendor }: VendorQuestionnaireAnswersProps) {
  const [isAddingToTrustPortal, setIsAddingToTrustPortal] = useState<boolean>(false);
  const [updatingAnswers, setUpdatingAnswers] = useState<Set<string>>(new Set());
  const trustPortalRepo = new TrustPortalRepository();

  // Update answer status (Pending/Completed/Reviewed)
  const updateAnswerStatus = async (answerId: string, status: 'Pending' | 'Completed' | 'Reviewed', shareToTrustPortal?: boolean) => {
    if (!answerId) {
      alert('Error: No answer ID provided');
      return;
    }
    
    try {
      setUpdatingAnswers(prev => new Set(prev).add(answerId));
      
      await vendorAPI.updateQuestionnaireAnswerStatus(vendor.id, answerId, {
        status,
        shareToTrustPortal
      });
      
      // Show success message
      const message = `Answer marked as ${status.toLowerCase()} successfully!`;
      if (typeof window !== 'undefined') {
        // Use a simple notification or alert for now
        alert(message);
      }
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating answer status:', error);
      alert(`Failed to update answer status: ${error.message || error}`);
    } finally {
      setUpdatingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(answerId);
        return newSet;
      });
    }
  };

  const addToTrustPortal = async (question: string, answer: string, answerId?: string) => {
    try {
      setIsAddingToTrustPortal(true);
      
      if (answerId) {
        // Update the share status in the database
        await vendorAPI.updateQuestionnaireAnswerShareStatus(vendor.id, answerId, true);
      }
      
      await trustPortalRepo.addTrustPortalItem({
        vendorId: parseInt(vendor.id),
        title: question,
        description: answer,
        category: 'Questionnaire',
        isQuestionnaireAnswer: true,
        questionnaireId: vendor.id,
        content: answer
      });
      alert('Successfully added to Trust Portal!');
    } catch (error) {
      console.error('Error adding to trust portal:', error);
      alert('Failed to add to Trust Portal');
    } finally {
      setIsAddingToTrustPortal(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Reviewed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Reviewed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const questionnaireAnswers = vendor.questionnaireAnswers || [];

  if (questionnaireAnswers.length === 0) {
    return (
      <div 
        id="questionnaire-answers"
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center mb-4">
          <FileText className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Questionnaire Answers</h2>
        </div>
        
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            No questionnaire answers available for this vendor yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="questionnaire-answers"
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Questionnaire Answers</h2>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <CheckCircle className="h-4 w-4 mr-1" />
          {questionnaireAnswers.length} question{questionnaireAnswers.length !== 1 ? 's' : ''} answered
        </div>
      </div>

      <div className="space-y-6">
        {questionnaireAnswers.map((qa, index) => (
          <div 
            key={qa.id || index} 
            className="border border-gray-200 rounded-lg p-4"
          >
            {/* Question Header with Status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start flex-1">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base leading-relaxed">
                    {qa.question}
                  </h3>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(qa.status)}`}>
                {getStatusIcon(qa.status)}
                <span className="ml-1">{qa.status || 'Pending'}</span>
              </div>
            </div>

            {/* Answer */}
            <div className="ml-11 mb-4">
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary/20">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {qa.answer}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="ml-11 flex flex-wrap gap-2">
              {qa.status !== 'Completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateAnswerStatus(qa.id!, 'Completed')}
                  disabled={updatingAnswers.has(qa.id!) || !qa.id}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  {updatingAnswers.has(qa.id!) ? (
                    <PlayCircle className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Mark Complete
                </Button>
              )}
              
              {qa.status === 'Completed' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateAnswerStatus(qa.id!, 'Completed', true)}
                    disabled={updatingAnswers.has(qa.id!) || !qa.id}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    {updatingAnswers.has(qa.id!) ? (
                      <Share2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-1" />
                    )}
                    Share to Trust Portal
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateAnswerStatus(qa.id!, 'Pending')}
                    disabled={updatingAnswers.has(qa.id!) || !qa.id}
                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Mark Pending
                  </Button>
                </>
              )}
              
              {qa.shareToTrustPortal && (
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <Share2 className="h-3 w-3 mr-1" />
                  Shared to Trust Portal
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="text-sm text-gray-500 text-center">
          Total of {questionnaireAnswers.length} questionnaire response{questionnaireAnswers.length !== 1 ? 's' : ''} for this vendor
        </div>
      </div>
    </div>
  );
} 
