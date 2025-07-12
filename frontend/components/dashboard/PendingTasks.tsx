'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Upload, 
  Send,
  ArrowRight,
  RefreshCw,
  Building2,
  Zap,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingTask {
  id: string;
  type: 'checklist_upload' | 'question_generation' | 'supporting_docs' | 'trust_portal_submission';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vendorId: number;
  vendorName: string;
  checklistId?: string;
  checklistName?: string;
  questionCount?: number;
  completedQuestions?: number;
  missingDocuments?: number;
  createdAt: string;
  navigationUrl: string;
  actionText: string;
}

interface PendingTasksProps {
  className?: string;
  limit?: number;
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

const TYPE_ICONS = {
  checklist_upload: Upload,
  question_generation: Zap,
  supporting_docs: FileText,
  trust_portal_submission: Send
};

const TYPE_COLORS = {
  checklist_upload: 'text-blue-600',
  question_generation: 'text-purple-600',
  supporting_docs: 'text-orange-600',
  trust_portal_submission: 'text-green-600'
};

export function PendingTasks({ className, limit = 5 }: PendingTasksProps) {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchTasks = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app';
      
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${backendUrl}/api/dashboard/pending-tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pending tasks: ${response.status}`);
      }

      const result = await response.json();
      const allTasks = result.data || [];
      
      // Limit tasks if specified
      const limitedTasks = limit ? allTasks.slice(0, limit) : allTasks;
      
      setTasks(limitedTasks);
    } catch (err: any) {
      console.error('Error fetching pending tasks:', err);
      setError(err.message || 'Failed to load pending tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (task: PendingTask) => {
    window.location.href = task.navigationUrl;
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium;
  };

  const getTypeIcon = (type: string) => {
    return TYPE_ICONS[type as keyof typeof TYPE_ICONS] || Clock;
  };

  const getTypeColor = (type: string) => {
    return TYPE_COLORS[type as keyof typeof TYPE_COLORS] || 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressInfo = (task: PendingTask) => {
    if (task.type === 'question_generation' && task.questionCount && task.completedQuestions !== undefined) {
      const progress = (task.completedQuestions / task.questionCount) * 100;
      return {
        show: true,
        progress,
        text: `${task.completedQuestions}/${task.questionCount} questions completed`
      };
    }
    
    if (task.type === 'supporting_docs' && task.missingDocuments) {
      return {
        show: true,
        progress: 0,
        text: `${task.missingDocuments} documents needed`
      };
    }
    
    return { show: false, progress: 0, text: '' };
  };

  useEffect(() => {
    fetchTasks();
  }, [limit]);

  if (isLoading) {
    return (
      <section className={cn("bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border", className)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary" />
            Pending Tasks
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
            <Clock className="h-5 w-5 mr-2 text-primary" />
            Pending Tasks
          </h2>
          <button
            onClick={fetchTasks}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button
            onClick={fetchTasks}
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
          <Clock className="h-5 w-5 mr-2 text-primary" />
          Pending Tasks
          {tasks.length > 0 && (
            <span className="ml-2 bg-primary/10 text-primary text-sm px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          )}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchTasks}
            className="text-primary hover:text-primary/80 transition-colors"
            title="Refresh tasks"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
          <p className="text-gray-600 dark:text-gray-300">
            No pending tasks at the moment. Great job keeping everything up to date!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const TypeIcon = getTypeIcon(task.type);
            const progressInfo = getProgressInfo(task);
            
            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary/20 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={cn("p-2 rounded-lg bg-gray-100 dark:bg-gray-800", getTypeColor(task.type))}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Building2 className="h-3 w-3" />
                        <span>{task.vendorName}</span>
                        {task.checklistName && (
                          <>
                            <span>•</span>
                            <span>{task.checklistName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDate(task.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full border",
                      getPriorityColor(task.priority)
                    )}>
                      {task.priority}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {progressInfo.show && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{progressInfo.text}</span>
                      <span>{Math.round(progressInfo.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressInfo.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Click to {task.actionText.toLowerCase()}
                  </div>
                  <button className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:bg-primary/90 transition-colors">
                    {task.actionText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
} 