import React, { useState, useEffect } from 'react';
import { Clock, FileText, Building2, CheckCircle, ArrowRight, Calendar } from 'lucide-react';
import { vendors as vendorAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

interface TrustPortalSubmission {
  id: number;
  vendorId: number;
  vendorName: string;
  vendorUuid: string;
  title: string;
  description?: string;
  category: string;
  isQuestionnaireAnswer: boolean;
  questionnaireId?: string;
  isFollowUp?: boolean;
  followUpType?: string;
  createdAt: string;
  content?: string;
}

interface SubmissionHistoryProps {
  limit?: number;
  showTitle?: boolean;
}

export default function SubmissionHistory({ limit = 5, showTitle = true }: SubmissionHistoryProps) {
  const { user, isAuthenticated } = useAuth();
  const [submissions, setSubmissions] = useState<TrustPortalSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchRecentSubmissions = async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching recent trust portal submissions...');
      const response = await vendorAPI.trustPortal.getRecentSubmissions(limit);
      
      console.log('Recent submissions API response:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        setSubmissions(response.data);
        console.log('Loaded recent submissions:', response.data);
      } else {
        console.log('No submissions found or API error:', response);
        setSubmissions([]);
        if (!response.success) {
          setError(response.error?.message || 'Failed to load submissions');
        }
      }
    } catch (err: any) {
      console.error('Error fetching recent submissions:', err);
      setError('Failed to load recent submissions. Please try again.');
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentSubmissions();
  }, [isAuthenticated, user, limit]);

  // Format the submission for display
  const formatSubmission = (submission: TrustPortalSubmission) => {
    const date = new Date(submission.createdAt);
    const relativeTime = getRelativeTime(date);
    
    // Parse content to get submission details
    let questionCount = 0;
    let submissionType = submission.category;
    
    if (submission.content) {
      try {
        const content = JSON.parse(submission.content);
        questionCount = content.questionCount || content.questions?.length || 0;
        if (content.checklistName) {
          submissionType = `${content.checklistName} Questionnaire`;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return {
      ...submission,
      formattedDate: relativeTime,
      questionCount,
      submissionType,
      displayTitle: submission.title.replace(' - Compliance Questionnaire', '')
    };
  };

  // Get relative time string
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
        )}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1">
                <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
        )}
        <div className="text-center py-4">
          <p className="text-red-600 mb-2">Error Loading Submissions</p>
          <p className="text-sm text-gray-600 mb-3">{error}</p>
          <button
            onClick={fetchRecentSubmissions}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
        )}
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h4>
          <p className="text-gray-600 mb-4">
            Trust portal submissions will appear here once you send questionnaires or documents.
          </p>
          <Link
            href="/questionnaires"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Go to Questionnaires
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
          <Link
            href="/trust-portal"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            View All
          </Link>
        </div>
      )}
      
      <div className="space-y-3">
        {submissions.map((submission) => {
          const formatted = formatSubmission(submission);
          
          return (
            <div key={submission.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 mt-1">
                {submission.isQuestionnaireAnswer ? (
                  <FileText className="h-5 w-5 text-blue-600" />
                ) : (
                  <Building2 className="h-5 w-5 text-green-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formatted.displayTitle}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {submission.vendorName}
                      {formatted.questionCount > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          {formatted.questionCount} questions
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 ml-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    Submitted
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {submission.isQuestionnaireAnswer ? 'Questionnaire' : formatted.submissionType}
                  </span>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatted.formattedDate}
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Link
                  href={`/trust-portal/vendor?id=${submission.vendorId}`}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      
      {submissions.length >= limit && (
        <div className="mt-4 pt-3 border-t">
          <Link
            href="/trust-portal"
            className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            View All Submissions
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
} 