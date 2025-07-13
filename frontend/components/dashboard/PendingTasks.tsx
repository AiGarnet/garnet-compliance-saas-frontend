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
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Pending tasks API response:', result);
      
      // Handle both direct array and wrapped response
      const pendingTasks = Array.isArray(result) ? result : (result.data || result || []);

      // Ensure we have an array and add action URLs to tasks
      const tasksArray = Array.isArray(pendingTasks) ? pendingTasks : [];
      const tasksWithUrls = tasksArray.map((task: any) => ({
        id: task.id || `task-${Date.now()}-${Math.random()}`,
        type: task.type || 'question_generation',
        title: task.title || 'Unknown Task',
        description: task.description || 'No description available',
        priority: task.priority || 'medium',
        checklistId: task.checklistId,
        checklistName: task.checklistName,
        vendorId: task.vendorId,
        vendorName: task.vendorName,
        questionsCount: task.questionsCount,
        missingDocumentsCount: task.missingDocumentsCount,
        estimatedTime: task.estimatedTime,
        actionUrl: getActionUrl(task)
      }));

      // Limit the results
      const limitedTasks = tasksWithUrls.slice(0, limit);
      setTasks(limitedTasks);
    } catch (err: any) {
      console.error('Error fetching pending tasks:', err);
      setError(err.message || 'Failed to load pending tasks');
      // Set empty array to prevent undefined errors
      setTasks([]);
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
    <section className={cn("bg-white dark:bg-card-bg rounded-xl shadow-sm border border-gray-200 dark:border-card-border overflow-hidden", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Tasks
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''} requiring attention
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {tasks.length > 0 && (
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-sm px-3 py-1 rounded-full font-medium">
                {tasks.length}
              </span>
            )}
            <button
              onClick={fetchPendingTasks}
              className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
              title="Refresh tasks"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
              No pending compliance tasks. Great job staying on top of your workflow!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const TaskIcon = TASK_ICONS[task.type] || FileText;
              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="group relative bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all cursor-pointer border border-transparent hover:border-orange-200 dark:hover:border-orange-700"
                >
                  <div className="flex items-start space-x-4">
                    {/* Task Icon */}
                    <div className={cn(
                      "flex-shrink-0 p-2.5 rounded-lg transition-colors",
                      task.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                      task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    )}>
                      <TaskIcon className={cn(
                        "h-5 w-5",
                        task.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                        task.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400'
                      )} />
                    </div>
                    
                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-orange-900 dark:group-hover:text-orange-100 transition-colors">
                          {task.title}
                        </h4>
                        <span className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium border",
                          task.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                          'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        )}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      
                      {/* Task Metadata */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          {task.vendorName && (
                            <span className="flex items-center bg-white dark:bg-gray-700 px-2 py-1 rounded border">
                              <Users className="h-3 w-3 mr-1" />
                              {task.vendorName}
                            </span>
                          )}
                          {task.estimatedTime && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.estimatedTime}
                            </span>
                          )}
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {tasks.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tasks.length} pending task{tasks.length !== 1 ? 's' : ''} • Click to take action
            </p>
            <button className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors flex items-center font-medium">
              View All Tasks
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
} 