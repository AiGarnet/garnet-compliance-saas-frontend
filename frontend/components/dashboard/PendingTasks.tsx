'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Share2,
  ChevronRight,
  RefreshCw,
  Zap,
  Users,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingTask {
  id: string;
  type: 'question_generation' | 'document_upload' | 'trust_portal_sharing';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  checklistId?: string;
  checklistName?: string;
  vendorId?: number;
  vendorName?: string;
  questionsCount?: number;
  missingDocumentsCount?: number;
  actionUrl?: string;
  estimatedTime?: string;
}

interface PendingTasksProps {
  className?: string;
  limit?: number;
}

const TASK_ICONS = {
  question_generation: Zap,
  document_upload: Upload,
  trust_portal_sharing: Share2
};

const PRIORITY_COLORS = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-800', 
  low: 'bg-blue-50 border-blue-200 text-blue-800'
};

const PRIORITY_ICONS = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500'
};

export function PendingTasks({ className, limit = 5 }: PendingTasksProps) {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchPendingTasks = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Use the new pending tasks API endpoint
      const response = await fetch(`${backendUrl}/api/checklists/pending-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending tasks');
      }

      const result = await response.json();
      const pendingTasks = result.data || [];

      // Add action URLs to tasks
      const tasksWithUrls = pendingTasks.map((task: any) => ({
        ...task,
        actionUrl: getActionUrl(task)
      }));

      // Limit the results
      const limitedTasks = tasksWithUrls.slice(0, limit);
      setTasks(limitedTasks);
    } catch (err: any) {
      console.error('Error fetching pending tasks:', err);
      setError(err.message || 'Failed to load pending tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionUrl = (task: any): string => {
    switch (task.type) {
      case 'question_generation':
        if (task.title === 'Generate Questions') {
          return `/questionnaires?checklistId=${task.checklistId}&vendorId=${task.vendorId}`;
        } else {
          return `/questionnaires/${task.checklistId}/chat?vendorId=${task.vendorId}`;
        }
      case 'document_upload':
        return `/questionnaires/${task.checklistId}?vendorId=${task.vendorId}`;
      case 'trust_portal_sharing':
        return `/trust-portal/vendor/${task.vendorId}`;
      default:
        return '/dashboard';
    }
  };

  const handleTaskClick = (task: PendingTask) => {
    if (task.actionUrl) {
      window.location.href = task.actionUrl;
    }
  };

  useEffect(() => {
    fetchPendingTasks();
  }, [limit]);

  if (isLoading) {
    return (
      <section className={cn("bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border", className)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
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
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            Pending Tasks
          </h2>
          <button
            onClick={fetchPendingTasks}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button
            onClick={fetchPendingTasks}
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
          <Clock className="h-5 w-5 mr-2 text-orange-500" />
          Pending Tasks
          {tasks.length > 0 && (
            <span className="ml-2 bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          )}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchPendingTasks}
            className="text-primary hover:text-primary/80 transition-colors"
            title="Refresh tasks"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
          <p className="text-gray-600 dark:text-gray-300">
            No pending compliance tasks. Great job staying on top of your workflow!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const TaskIcon = TASK_ICONS[task.type];
            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg",
                      PRIORITY_COLORS[task.priority]
                    )}>
                      <TaskIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {task.title}
                        </h4>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full border",
                          PRIORITY_COLORS[task.priority]
                        )}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {task.vendorName && (
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {task.vendorName}
                          </span>
                        )}
                        {task.checklistName && (
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {task.checklistName}
                          </span>
                        )}
                        {task.estimatedTime && (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.estimatedTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0 ml-2" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500 dark:text-gray-400">
              {tasks.length} pending task{tasks.length !== 1 ? 's' : ''} found
            </p>
            <button className="text-primary hover:text-primary/80 transition-colors flex items-center">
              View All Tasks
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
} 