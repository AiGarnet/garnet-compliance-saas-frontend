"use client";

import React from 'react';
import { VendorDetail } from '@/hooks/useVendor';
import { Clock, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface QuestionnaireStatusProps {
  vendor: VendorDetail;
}

export function QuestionnaireStatus({ vendor }: QuestionnaireStatusProps) {
  // Calculate the progress based on actual answers - dynamic questionnaire
  const questionnaireAnswers = vendor.questionnaireAnswers || [];
  const totalQuestions = questionnaireAnswers.length;
  const completedQuestions = questionnaireAnswers.filter(qa => qa.status === 'Completed').length;
  const progress = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;
  
  const getStatusInfo = () => {
    switch (vendor.status) {
      case 'Approved':
        return {
          icon: <CheckCircle2 className="h-10 w-10 text-success" />,
          title: 'Approved',
          description: 'This vendor has been approved and is ready for integration.',
          color: 'text-success',
          bgColor: 'bg-success-light',
          borderColor: 'border-success',
          descriptionColor: 'text-gray-600'
        };
      case 'In Review':
        return {
          icon: <Clock className="h-10 w-10 text-warning" />,
          title: 'In Review',
          description: 'This vendor\'s questionnaire is currently being reviewed.',
          color: 'text-warning',
          bgColor: 'bg-warning-light',
          borderColor: 'border-warning',
          descriptionColor: 'text-gray-600'
        };
      case 'Questionnaire Pending':
        return {
          icon: <HelpCircle className="h-10 w-10 text-secondary" />,
          title: 'Questionnaire Pending',
          description: 'Waiting for the vendor to complete the questionnaire.',
          color: 'text-secondary',
          bgColor: 'bg-secondary-light',
          borderColor: 'border-secondary',
          descriptionColor: 'text-gray-600'
        };
      default:
        return {
          icon: <AlertTriangle className="h-10 w-10 text-danger" />,
          title: 'Status Unknown',
          description: 'The status of this vendor is currently unknown.',
          color: 'text-danger',
          bgColor: 'bg-danger-light',
          borderColor: 'border-danger',
          descriptionColor: 'text-gray-900 font-semibold'
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  const isUnknownStatus = vendor.status === undefined || vendor.status === null;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Questionnaire Status</h2>
      
      <div className={`flex items-start p-4 rounded-lg ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
        <div className="mr-4 flex-shrink-0">
          {statusInfo.icon}
        </div>
        <div>
          <h3 className={`font-medium text-lg ${statusInfo.color}`}>{statusInfo.title}</h3>
          <p 
            className={`${statusInfo.descriptionColor} mt-1 ${isUnknownStatus ? 'text-base font-semibold' : ''}`} 
            style={isUnknownStatus ? { textShadow: '0 0 1px rgba(255,255,255,0.5)' } : undefined}
          >
            {statusInfo.description}
          </p>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Questionnaire Completion</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {completedQuestions} of {totalQuestions} questions completed
        </div>
      </div>
      
      {totalQuestions > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3 text-gray-800">Questionnaire Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending Questions:</span>
              <span className="font-medium text-yellow-600">{totalQuestions - completedQuestions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed Questions:</span>
              <span className="font-medium text-green-600">{completedQuestions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Questions:</span>
              <span className="font-medium">{totalQuestions}</span>
            </div>
          </div>
          
          {progress === 100 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  All questions completed! Ready for trust portal sharing.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {totalQuestions === 0 && (
        <div className="mt-6 text-center py-4">
          <div className="text-gray-500 text-sm">
            No questionnaire assigned yet. Create questions to get started.
          </div>
        </div>
      )}
    </div>
  );
} 