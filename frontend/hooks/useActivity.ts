import { useState, useEffect, useCallback } from 'react';
import { Activity, ActivityType, ActivityMetadata, ActivityFilters, ActivitySummary } from '@/types/activity';
import { activityService } from '@/lib/services/activityService';
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

export function useActivity(filters?: ActivityFilters): UseActivityReturn {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load activities on mount and when filters change
  const loadActivities = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      const allActivities = activityService.getActivities(filters);
      const recent = activityService.getRecentActivities(10);
      
      setActivities(allActivities);
      setRecentActivities(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      console.error('Error loading activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Log a new activity
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
      activityService.logActivity(
        type,
        user.id || user.email || 'unknown',
        user.full_name || user.email || 'Unknown User',
        customDescription,
        metadata
      );
      
      // Refresh activities after logging
      loadActivities();
    } catch (err) {
      console.error('Error logging activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    }
  }, [user, loadActivities]);

  // Refresh activities
  const refreshActivities = useCallback(() => {
    loadActivities();
  }, [loadActivities]);

  // Get filtered activities
  const getFilteredActivities = useCallback((activityFilters: ActivityFilters): Activity[] => {
    return activityService.getActivities(activityFilters);
  }, []);

  // Get activity summary
  const getActivitySummary = useCallback((): ActivitySummary => {
    return activityService.getActivitySummary();
  }, []);

  // Clear all activities
  const clearActivities = useCallback(() => {
    activityService.clearActivities();
    loadActivities();
  }, [loadActivities]);

  // Add sample activities for testing
  const addSampleActivities = useCallback(() => {
    activityService.addSampleActivities();
    loadActivities();
  }, [loadActivities]);

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