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
    // Dynamic status based on actual question completion
    if (totalQuestions === 0) {
      return {
        icon: <HelpCircle className="h-10 w-10 text-gray-500" />,
        title: 'No Questionnaire',
        description: 'No questionnaire has been assigned to this vendor yet.',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        descriptionColor: 'text-gray-600'
      };
    }
    
    if (progress === 100) {
      return {
        icon: <CheckCircle2 className="h-10 w-10 text-green-600" />,
        title: 'Questionnaire Completed',
        description: 'All questionnaire questions have been completed.',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        descriptionColor: 'text-gray-600'
      };
    }
    
    if (progress > 0) {
      return {
        icon: <Clock className="h-10 w-10 text-yellow-600" />,
        title: 'Questionnaire In Progress',
        description: `${completedQuestions} of ${totalQuestions} questions completed. ${totalQuestions - completedQuestions} questions remaining.`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        descriptionColor: 'text-gray-600'
      };
    }
    
    // Default: No questions completed yet
    return {
      icon: <AlertTriangle className="h-10 w-10 text-red-600" />,
      title: 'Questionnaire Pending',
      description: 'Waiting for the vendor to complete the questionnaire.',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      descriptionColor: 'text-gray-600'
    };
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
