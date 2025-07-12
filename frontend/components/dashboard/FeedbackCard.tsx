'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Building2,
  Mail,
  Eye,
  MessageCircle,
  Calendar,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feedback {
  id: number;
  vendorId: number;
  enterpriseContactEmail: string;
  enterpriseContactName?: string;
  enterpriseCompanyName?: string;
  feedbackType: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  vendorName?: string;
}

interface FeedbackCardProps {
  className?: string;
  limit?: number;
}

const PRIORITY_COLORS = {
  URGENT: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200'
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800'
};

const FEEDBACK_TYPE_LABELS = {
  GENERAL: 'General',
  DOCUMENT_REQUEST: 'Document Request',
  CLARIFICATION: 'Clarification',
  COMPLIANCE_ISSUE: 'Compliance Issue',
  FOLLOW_UP: 'Follow Up'
};

export function FeedbackCard({ className, limit = 5 }: FeedbackCardProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set());

  const fetchFeedback = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app';
      
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Use the new endpoint to get all feedback for user's vendors
      const response = await fetch(`${backendUrl}/api/trust-portal/feedback`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.status}`);
      }

      const result = await response.json();
      const allFeedback = result.data || [];
      
      // Sort by creation date (newest first) and limit
      const sortedFeedback = allFeedback
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      
      setFeedback(sortedFeedback);
    } catch (err: any) {
      console.error('Error fetching feedback:', err);
      setError(err.message || 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (feedbackId: number) => {
    const newExpanded = new Set(expandedFeedback);
    if (expandedFeedback.has(feedbackId)) {
      newExpanded.delete(feedbackId);
    } else {
      newExpanded.add(feedbackId);
    }
    setExpandedFeedback(newExpanded);
  };

  const handleFeedbackClick = async (feedbackId: number) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${backendUrl}/api/dashboard/feedback/${feedbackId}/navigation`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.navigationUrl) {
          window.location.href = result.data.navigationUrl;
        }
      } else {
        console.error('Failed to get navigation info');
      }
    } catch (error) {
      console.error('Error getting feedback navigation:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.MEDIUM;
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.PENDING;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  useEffect(() => {
    fetchFeedback();
  }, [limit]);

  if (isLoading) {
    return (
      <section className={cn("bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border", className)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
            Enterprise Feedback
          </h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cn("bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border", className)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
            Enterprise Feedback
          </h2>
          <button
            onClick={fetchFeedback}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button
            onClick={fetchFeedback}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-primary" />
          Enterprise Feedback
          {feedback.length > 0 && (
            <span className="ml-2 bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
              {feedback.length}
            </span>
          )}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchFeedback}
            className="text-primary hover:text-primary/80 transition-colors"
            title="Refresh feedback"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <a
            href="/trust-portal"
            className="text-sm text-primary font-medium hover:text-primary/80 transition-colors flex items-center"
          >
            View All
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>

      {feedback.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Feedback Yet</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Enterprise feedback will appear here when customers provide input on your trust portal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary/20 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer group"
              onClick={() => handleFeedbackClick(item.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {item.subject}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {item.vendorName}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {item.enterpriseCompanyName || 'Enterprise'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full border",
                        getPriorityColor(item.priority)
                      )}>
                        {item.priority}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        getStatusColor(item.status)
                      )}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {expandedFeedback.has(item.id) ? item.message : truncateMessage(item.message)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {item.enterpriseContactEmail}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {FEEDBACK_TYPE_LABELS[item.feedbackType as keyof typeof FEEDBACK_TYPE_LABELS] || item.feedbackType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {item.message.length > 100 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(item.id);
                          }}
                          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {expandedFeedback.has(item.id) ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                      <div className="text-xs text-gray-500 group-hover:text-primary transition-colors">
                        Click to navigate to relevant section →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
} 