import React from 'react';
import { 
  UserPlus, Edit, Trash2, RefreshCw, FileText, Send, Eye, CheckCircle, XCircle,
  Upload, FileUp, Play, TrendingUp, Shield, LogIn, LogOut, User, Share,
  FileBarChart, Download, Link, Activity as ActivityIcon, AlertCircle, Loader2
} from 'lucide-react';
import { Activity } from '@/types/activity';
import { useActivity } from '@/hooks/useActivity';
import { activityService } from '@/lib/services/activityService';
import { cn } from '@/lib/utils';

// Icon mapping for dynamic rendering
const iconMap = {
  UserPlus, Edit, Trash2, RefreshCw, FileText, Send, Eye, CheckCircle, XCircle,
  Upload, FileUp, Play, TrendingUp, Shield, LogIn, LogOut, User, Share,
  FileBarChart, Download, Link
};

interface RecentActivityProps {
  className?: string;
  limit?: number;
  showHeader?: boolean;
  showViewAll?: boolean;
}

interface ActivityItemProps {
  activity: Activity;
  isLast?: boolean;
}

function ActivityItem({ activity, isLast = false }: ActivityItemProps) {
  const IconComponent = iconMap[activity.icon?.name as keyof typeof iconMap] || ActivityIcon;
  const timestamp = activityService.formatTimestamp(activity.timestamp);

  return (
    <li className={cn(
      "pb-4",
      !isLast && "border-b border-gray-100 dark:border-gray-700"
    )}>
      <div className="flex items-start">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 transition-colors",
          activity.color?.bg || "bg-gray-100",
          "dark:bg-opacity-20"
        )}>
          <IconComponent className={cn(
            "w-5 h-5",
            activity.color?.text || "text-gray-600",
            "dark:text-opacity-80"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white leading-relaxed">
            {activity.description}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {timestamp}
          </p>
        </div>
      </div>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading activities...</span>
      </div>
    </div>
  );
}

function EmptyState({ onAddSample }: { onAddSample: () => void }) {
  return (
    <div className="text-center py-8">
      <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        No recent activity found
      </p>
      <button
        onClick={onAddSample}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        Add sample activities
      </button>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

export function RecentActivity({ 
  className, 
  limit = 5, 
  showHeader = true, 
  showViewAll = true 
}: RecentActivityProps) {
  const { 
    recentActivities, 
    isLoading, 
    error, 
    refreshActivities, 
    addSampleActivities 
  } = useActivity();

  // Limit the activities displayed
  const displayedActivities = recentActivities.slice(0, limit);

  const handleViewAll = () => {
    // For now, open activities in a new modal or show all activities in current component
    // Future: navigate to /activities page
    console.log('View all activities clicked');
    
    // Trigger a modal or expand the current view
    if (typeof window !== 'undefined') {
      // For now, we'll expand the limit to show more activities
      window.dispatchEvent(new CustomEvent('expandActivities', { 
        detail: { showAll: true } 
      }));
    }
  };

  const handleAddSample = () => {
    addSampleActivities();
  };

  const handleRetry = () => {
    refreshActivities();
  };

  return (
    <section className={cn(
      "bg-white dark:bg-card-bg rounded-xl shadow-sm border border-gray-200 dark:border-card-border overflow-hidden",
      className
    )}>
      {/* Header */}
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ActivityIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {recentActivities.length} recent action{recentActivities.length !== 1 ? 's' : ''} in your workspace
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {recentActivities.length > 0 && (
                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm px-3 py-1 rounded-full font-medium">
                  {recentActivities.length}
                </span>
              )}
              <button
                onClick={refreshActivities}
                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                title="Refresh activities"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              {showViewAll && (
                <button
                  onClick={handleViewAll}
                  className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                  title="View all activities"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading activities...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
              {error}
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        ) : displayedActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <ActivityIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Recent Activity</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
              No recent activity found in your workspace
            </p>
            <button
              onClick={handleAddSample}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Add Sample Activities
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => {
              const IconComponent = iconMap[activity.icon?.name as keyof typeof iconMap] || ActivityIcon;
              const timestamp = activityService.formatTimestamp(activity.timestamp);
              const isLast = index === displayedActivities.length - 1;

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors",
                    !isLast && "mb-2"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    activity.color?.bg || "bg-gray-100 dark:bg-gray-700",
                    "dark:bg-opacity-20"
                  )}>
                    <IconComponent className={cn(
                      "w-5 h-5",
                      activity.color?.text || "text-gray-600 dark:text-gray-400",
                      "dark:text-opacity-80"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white leading-relaxed">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {timestamp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {displayedActivities.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {displayedActivities.length} of {recentActivities.length} recent activities
            </p>
            {showViewAll && (
              <button
                onClick={handleViewAll}
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors flex items-center font-medium"
              >
                View All Activities
                <Eye className="h-3 w-3 ml-1" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
} 