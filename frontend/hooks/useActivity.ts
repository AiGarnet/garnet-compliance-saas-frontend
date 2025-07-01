import { useState, useEffect, useCallback } from 'react';
import { Activity, ActivityType, ActivityMetadata, ActivityFilters, ActivitySummary } from '@/types/activity';
import { activityService } from '@/lib/services/activityService';
import activityApiService, { BackendActivity, ActivityFilters as ApiActivityFilters } from '@/lib/services/activityApiService';
import { useAuth } from '@/lib/auth/AuthContext';

export interface UseActivityReturn {
  // State
  activities: Activity[];
  recentActivities: Activity[];
  isLoading: boolean;
  error: string | null;
  
  // Methods
  logActivity: (type: ActivityType, customDescription?: string, metadata?: ActivityMetadata) => void;
  refreshActivities: () => void;
  getFilteredActivities: (filters: ActivityFilters) => Activity[];
  getActivitySummary: () => ActivitySummary;
  clearActivities: () => void;
  addSampleActivities: () => void;
  
  // Convenience methods for common activities
  logClientCreated: (clientName: string) => void;
  logClientUpdated: (clientName: string) => void;
  logClientDeleted: (clientName: string) => void;
  logClientStatusChanged: (clientName: string, oldStatus: string, newStatus: string) => void;
  logQuestionnaireSubmitted: (clientName: string, questionnaireName?: string) => void;
  logEvidenceUploaded: (fileName: string, frameworkType?: string) => void;
  logLogin: () => void;
  logLogout: () => void;
}

// Transform backend activity to frontend activity format
function transformBackendActivity(backendActivity: BackendActivity): Activity {
  const activityType = backendActivity.type as ActivityType;
  
  // Map activity types to icons and colors
  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'client_created':
      case 'vendor_created':
        return {
          icon: { name: 'UserPlus', type: 'lucide' as const },
          color: { bg: 'bg-green-100', text: 'text-green-600' }
        };
      case 'client_updated':
      case 'vendor_updated':
        return {
          icon: { name: 'Edit', type: 'lucide' as const },
          color: { bg: 'bg-blue-100', text: 'text-blue-600' }
        };
      case 'client_deleted':
      case 'vendor_deleted':
        return {
          icon: { name: 'Trash2', type: 'lucide' as const },
          color: { bg: 'bg-red-100', text: 'text-red-600' }
        };
      case 'questionnaire_submitted':
        return {
          icon: { name: 'FileText', type: 'lucide' as const },
          color: { bg: 'bg-purple-100', text: 'text-purple-600' }
        };
      case 'checklist_uploaded':
      case 'evidence_uploaded':
        return {
          icon: { name: 'Upload', type: 'lucide' as const },
          color: { bg: 'bg-orange-100', text: 'text-orange-600' }
        };
      case 'user_login':
        return {
          icon: { name: 'LogIn', type: 'lucide' as const },
          color: { bg: 'bg-green-100', text: 'text-green-600' }
        };
      case 'user_logout':
        return {
          icon: { name: 'LogOut', type: 'lucide' as const },
          color: { bg: 'bg-gray-100', text: 'text-gray-600' }
        };
      default:
        return {
          icon: { name: 'Activity', type: 'lucide' as const },
          color: { bg: 'bg-blue-100', text: 'text-blue-600' }
        };
    }
  };

  const iconAndColor = getIconAndColor(backendActivity.type);

  return {
    id: backendActivity.id,
    type: activityType,
    userId: backendActivity.userId || '',
    userName: backendActivity.userName || backendActivity.userEmail || 'Unknown User',
    description: backendActivity.description,
    metadata: backendActivity.metadata,
    timestamp: new Date(backendActivity.createdAt),
    icon: iconAndColor.icon,
    color: iconAndColor.color
  };
}

export function useActivity(filters?: ActivityFilters): UseActivityReturn {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load activities from backend API
  const loadActivitiesFromApi = useCallback(async () => {
    if (!isClient) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Convert frontend filters to API filters
      const apiFilters: ApiActivityFilters = {};
      if (filters) {
        if (filters.types) apiFilters.type = filters.types as any;
        if (filters.userId) apiFilters.userId = filters.userId;
        if (filters.dateRange?.start) apiFilters.startDate = filters.dateRange.start;
        if (filters.dateRange?.end) apiFilters.endDate = filters.dateRange.end;
        if (filters.limit) apiFilters.limit = filters.limit;
        if (filters.offset) apiFilters.offset = filters.offset;
      }

      // Add user filter if available and not already specified
      if (user?.id && !apiFilters.userId) {
        apiFilters.userId = user.id;
      }
      
      // Fetch activities and recent activities in parallel
      const [activitiesResponse, recentResponse] = await Promise.all([
        activityApiService.getActivities(apiFilters),
        activityApiService.getRecentActivities(10, user?.id)
      ]);
      
      // Handle activities response with null checks
      if (activitiesResponse.success && activitiesResponse.data && Array.isArray(activitiesResponse.data)) {
        const transformedActivities = activitiesResponse.data.map(transformBackendActivity);
        setActivities(transformedActivities);
      } else if (activitiesResponse.success && !activitiesResponse.data) {
        // Empty response is valid
        setActivities([]);
      } else {
        console.warn('Activities API returned non-array data or failed:', activitiesResponse);
        throw new Error(activitiesResponse.error?.message || 'Failed to fetch activities - invalid data format');
      }

      // Handle recent activities response with null checks
      if (recentResponse.success && recentResponse.data && Array.isArray(recentResponse.data)) {
        const transformedRecent = recentResponse.data.map(transformBackendActivity);
        setRecentActivities(transformedRecent);
      } else if (recentResponse.success && !recentResponse.data) {
        // Empty response is valid
        setRecentActivities([]);
      } else {
        console.warn('Recent activities API returned non-array data or failed:', recentResponse);
        // Don't throw error for recent activities, just log warning and set empty array
        setRecentActivities([]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      console.error('Error loading activities from API:', err);
      
      // Fallback to local storage if API fails
      console.log('Falling back to local storage...');
      try {
        const allActivities = activityService.getActivities(filters);
        const recent = activityService.getRecentActivities(10);
        setActivities(allActivities || []);
        setRecentActivities(recent || []);
      } catch (localError) {
        console.error('Local storage fallback also failed:', localError);
        // Set empty arrays as final fallback
        setActivities([]);
        setRecentActivities([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, user?.id, isClient]);

  // Load activities on mount and when filters change
  useEffect(() => {
    if (isClient) {
      loadActivitiesFromApi();
    }
  }, [loadActivitiesFromApi]);

  // Listen for custom refresh events
  useEffect(() => {
    if (!isClient) return;

    const handleRefreshActivities = () => {
      console.log('Refreshing activities due to custom event');
      loadActivitiesFromApi();
    };

    window.addEventListener('refreshActivities', handleRefreshActivities);
    
    return () => {
      window.removeEventListener('refreshActivities', handleRefreshActivities);
    };
  }, [loadActivitiesFromApi, isClient]);

  // Log a new activity (API calls are handled by individual service methods)
  const logActivity = useCallback((
    type: ActivityType,
    customDescription?: string,
    metadata?: ActivityMetadata
  ) => {
    if (!user) {
      console.warn('Cannot log activity: user not authenticated');
      return;
    }

    try {
      // Log to local storage for immediate UI update
      activityService.logActivity(
        type,
        user.id || user.email || 'unknown',
        user.full_name || user.email || 'Unknown User',
        customDescription,
        metadata
      );
      
      // The API logging is handled by the specific service methods (createVendor, updateVendor, etc.)
      // This is just for manual activity logging
      console.log('Activity logged locally:', type, metadata);
      
      // Refresh activities after logging
      setTimeout(() => loadActivitiesFromApi(), 1000); // Small delay to allow backend processing
    } catch (err) {
      console.error('Error logging activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    }
  }, [user, loadActivitiesFromApi]);

  // Refresh activities
  const refreshActivities = useCallback(() => {
    loadActivitiesFromApi();
  }, [loadActivitiesFromApi]);

  // Get filtered activities (local only)
  const getFilteredActivities = useCallback((activityFilters: ActivityFilters): Activity[] => {
    return activityService.getActivities(activityFilters);
  }, []);

  // Get activity summary (local only)
  const getActivitySummary = useCallback((): ActivitySummary => {
    return activityService.getActivitySummary();
  }, []);

  // Clear all activities (local only)
  const clearActivities = useCallback(() => {
    activityService.clearActivities();
    setActivities([]);
    setRecentActivities([]);
  }, []);

  // Add sample activities for testing (local only)
  const addSampleActivities = useCallback(() => {
    activityService.addSampleActivities();
    // Also refresh from API to get any backend sample data
    setTimeout(() => loadActivitiesFromApi(), 500);
  }, [loadActivitiesFromApi]);

  // Convenience methods for common activities
  const logClientCreated = useCallback((clientName: string) => {
    logActivity(ActivityType.CLIENT_CREATED, undefined, { clientName });
  }, [logActivity]);

  const logClientUpdated = useCallback((clientName: string) => {
    logActivity(ActivityType.CLIENT_UPDATED, undefined, { clientName });
  }, [logActivity]);

  const logClientDeleted = useCallback((clientName: string) => {
    logActivity(ActivityType.CLIENT_DELETED, undefined, { clientName });
  }, [logActivity]);

  const logClientStatusChanged = useCallback((
    clientName: string,
    oldStatus: string,
    newStatus: string
  ) => {
    logActivity(ActivityType.CLIENT_STATUS_CHANGED, undefined, {
      clientName,
      previousStatus: oldStatus,
      newStatus
    });
  }, [logActivity]);

  const logQuestionnaireSubmitted = useCallback((
    clientName: string,
    questionnaireName?: string
  ) => {
    logActivity(ActivityType.QUESTIONNAIRE_SUBMITTED, undefined, {
      clientName,
      questionnaireName
    });
  }, [logActivity]);

  const logEvidenceUploaded = useCallback((
    fileName: string,
    frameworkType?: string
  ) => {
    logActivity(ActivityType.EVIDENCE_UPLOADED, undefined, {
      fileName,
      frameworkType
    });
  }, [logActivity]);

  const logLogin = useCallback(() => {
    logActivity(ActivityType.USER_LOGIN);
  }, [logActivity]);

  const logLogout = useCallback(() => {
    logActivity(ActivityType.USER_LOGOUT);
  }, [logActivity]);

  return {
    // State
    activities,
    recentActivities,
    isLoading,
    error,
    
    // Methods
    logActivity,
    refreshActivities,
    getFilteredActivities,
    getActivitySummary,
    clearActivities,
    addSampleActivities,
    
    // Convenience methods
    logClientCreated,
    logClientUpdated,
    logClientDeleted,
    logClientStatusChanged,
    logQuestionnaireSubmitted,
    logEvidenceUploaded,
    logLogin,
    logLogout
  };
} 