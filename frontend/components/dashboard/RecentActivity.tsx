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

function EmptyState() {
  return (
    <div className="text-center py-8">
      <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">
        No recent activity found
      </p>
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
    refreshActivities 
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

  const handleRetry = () => {
    refreshActivities();
  };

  return (
    <section className={cn(
      "bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border",
      className
    )}>
      {showHeader && (
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Recent Activity
          </h2>
          {showViewAll && (
            <button
              onClick={handleViewAll}
              className="text-sm text-primary font-medium hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1 transition-colors"
            >
              View All
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={handleRetry} />
      ) : displayedActivities.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-4" role="list">
          {displayedActivities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === displayedActivities.length - 1}
            />
          ))}
        </ul>
      )}

      {/* Footer with activity count */}
      {displayedActivities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Showing {displayedActivities.length} of {recentActivities.length} recent activities
          </p>
        </div>
      )}
    </section>
  );
} 