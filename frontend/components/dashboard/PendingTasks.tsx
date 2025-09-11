'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Share2,
  Zap,
  Users
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

      // Ensure we have an array and filter out setup/no vendor tasks
      const tasksArray = Array.isArray(pendingTasks) ? pendingTasks : [];
      const filteredTasks = tasksArray.filter((task: any) => 
        task.type !== 'setup' && 
        task.id !== 'no_vendors' && 
        task.id !== 'no_content'
      );

      // Limit the results
      const limitedTasks = filteredTasks.slice(0, limit);
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
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">
            No pending tasks
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const TaskIcon = TASK_ICONS[task.type] || FileText;
            return (
              <div
                key={task.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
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
          </div>
        </div>
      )}
    </section>
  );
} 