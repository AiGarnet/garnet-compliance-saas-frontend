import { Activity, ActivityType, ActivityMetadata, ActivityFilters, ActivitySummary, ACTIVITY_CONFIG, ACTIVITY_COLORS } from '@/types/activity';

class ActivityService {
  private activities: Activity[] = [];
  private readonly STORAGE_KEY = 'garnet_activities';
  private readonly MAX_ACTIVITIES = 1000; // Limit to prevent memory issues
  private isClient: boolean = false;

  constructor() {
    // Check if we're running in the browser
    this.isClient = typeof window !== 'undefined';
    if (this.isClient) {
      this.loadActivities();
    }
  }

  // Check if localStorage is available
  private isLocalStorageAvailable(): boolean {
    try {
      return this.isClient && typeof localStorage !== 'undefined';
    } catch (error) {
      return false;
    }
  }

  // Load activities from localStorage
  private loadActivities(): void {
    if (!this.isLocalStorageAvailable()) {
      console.warn('ActivityService: localStorage not available, using in-memory storage');
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.activities = parsed.map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading activities from localStorage:', error);
      this.activities = [];
    }
  }

  // Save activities to localStorage
  private saveActivities(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.activities));
    } catch (error) {
      console.error('Error saving activities to localStorage:', error);
    }
  }

  // Generate unique ID for activities
  private generateId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log a new activity
  logActivity(
    type: ActivityType,
    userId: string,
    userName: string,
    customDescription?: string,
    metadata?: ActivityMetadata
  ): Activity {
    const config = ACTIVITY_CONFIG[type];
    const description = customDescription || this.generateDescription(type, userName, metadata);
    
    const activity: Activity = {
      id: this.generateId(),
      type,
      userId,
      userName,
      description,
      metadata,
      timestamp: new Date(),
      icon: { name: config.icon, type: 'lucide' },
      color: ACTIVITY_COLORS[config.color]
    };

    // Add to beginning of array (most recent first)
    this.activities.unshift(activity);

    // Trim to max size
    if (this.activities.length > this.MAX_ACTIVITIES) {
      this.activities = this.activities.slice(0, this.MAX_ACTIVITIES);
    }

    this.saveActivities();
    return activity;
  }

  // Generate description based on activity type and metadata
  private generateDescription(type: ActivityType, userName: string, metadata?: ActivityMetadata): string {
    const config = ACTIVITY_CONFIG[type];
    
    switch (type) {
      case ActivityType.CLIENT_CREATED:
        return `${userName} created client "${metadata?.clientName}"`;
      
      case ActivityType.CLIENT_UPDATED:
        return `${userName} updated client "${metadata?.clientName}"`;
      
      case ActivityType.CLIENT_DELETED:
        return `${userName} deleted client "${metadata?.clientName}"`;
      
      case ActivityType.CLIENT_STATUS_CHANGED:
        return `${userName} changed client "${metadata?.clientName}" status from ${metadata?.previousStatus} to ${metadata?.newStatus}`;
      
      case ActivityType.QUESTIONNAIRE_CREATED:
        return `${userName} created questionnaire "${metadata?.questionnaireName}"`;
      
      case ActivityType.QUESTIONNAIRE_SUBMITTED:
        return `${userName} submitted questionnaire for "${metadata?.clientName}"`;
      
      case ActivityType.EVIDENCE_UPLOADED:
        return `${userName} uploaded evidence document "${metadata?.fileName}" for ${metadata?.frameworkType || 'compliance'}`;
      
      case ActivityType.COMPLIANCE_ASSESSMENT_COMPLETED:
        return `${userName} completed ${metadata?.frameworkType || 'compliance'} assessment`;
      
      case ActivityType.COMPLIANCE_SCORE_UPDATED:
        const scoreChange = metadata?.complianceScore && metadata?.previousScore 
          ? metadata.complianceScore > metadata.previousScore ? 'increased' : 'decreased'
          : 'updated';
        return `${userName} ${scoreChange} compliance score to ${metadata?.complianceScore}%`;
      
      case ActivityType.USER_LOGIN:
        return `${userName} logged in`;
      
      case ActivityType.USER_LOGOUT:
        return `${userName} logged out`;
      
      case ActivityType.TRUST_PORTAL_VIEWED:
        return `${userName} viewed trust portal`;
      
      case ActivityType.REPORT_GENERATED:
        return `${userName} generated compliance report`;
      
      default:
        return `${userName} ${config.defaultDescription}`;
    }
  }

  // Get activities with optional filtering
  getActivities(filters?: ActivityFilters): Activity[] {
    let filtered = [...this.activities];

    if (filters) {
      if (filters.types && filters.types.length > 0) {
        filtered = filtered.filter(activity => filters.types!.includes(activity.type));
      }

      if (filters.userId) {
        filtered = filtered.filter(activity => activity.userId === filters.userId);
      }

      if (filters.dateRange) {
        filtered = filtered.filter(activity => 
          activity.timestamp >= filters.dateRange!.start && 
          activity.timestamp <= filters.dateRange!.end
        );
      }

      if (filters.offset) {
        filtered = filtered.slice(filters.offset);
      }

      if (filters.limit) {
        filtered = filtered.slice(0, filters.limit);
      }
    }

    return filtered;
  }

  // Get recent activities (default last 10)
  getRecentActivities(limit: number = 10): Activity[] {
    return this.activities.slice(0, limit);
  }

  // Get activities for today
  getTodayActivities(): Activity[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getActivities({
      dateRange: { start: today, end: tomorrow }
    });
  }

  // Get activities for this week
  getWeekActivities(): Activity[] {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return this.getActivities({
      dateRange: { start: weekStart, end: now }
    });
  }

  // Get activity summary/statistics
  getActivitySummary(): ActivitySummary {
    const allActivities = this.activities;
    const todayActivities = this.getTodayActivities();
    const weekActivities = this.getWeekActivities();

    // Get activity type counts
    const typeCounts: Record<string, number> = {};
    allActivities.forEach(activity => {
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
    });

    const topActivityTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type: type as ActivityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get user activity counts
    const userCounts: Record<string, { userName: string; count: number }> = {};
    allActivities.forEach(activity => {
      if (!userCounts[activity.userId]) {
        userCounts[activity.userId] = { userName: activity.userName, count: 0 };
      }
      userCounts[activity.userId].count++;
    });

    const mostActiveUsers = Object.entries(userCounts)
      .map(([userId, data]) => ({
        userId,
        userName: data.userName,
        activityCount: data.count
      }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 5);

    // Get month activities
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthActivities = this.getActivities({
      dateRange: { start: monthStart, end: now }
    });

    return {
      totalActivities: allActivities.length,
      todayActivities: todayActivities.length,
      weekActivities: weekActivities.length,
      monthActivities: monthActivities.length,
      topActivityTypes,
      mostActiveUsers
    };
  }

  // Format timestamp for display
  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  // Clear all activities (for testing/cleanup)
  clearActivities(): void {
    this.activities = [];
    this.saveActivities();
  }

  // Add some sample activities for testing
  addSampleActivities(): void {
    const sampleActivities = [
      {
        type: ActivityType.CLIENT_CREATED,
        userId: 'user1',
        userName: 'John Doe',
        metadata: { clientName: 'Acme Corporation' }
      },
      {
        type: ActivityType.QUESTIONNAIRE_SUBMITTED,
        userId: 'user2',
        userName: 'Jane Smith',
        metadata: { clientName: 'TechCorp', questionnaireName: 'SOC 2 Assessment' }
      },
      {
        type: ActivityType.EVIDENCE_UPLOADED,
        userId: 'user1',
        userName: 'John Doe',
        metadata: { fileName: 'security_policy.pdf', frameworkType: 'ISO 27001' }
      },
      {
        type: ActivityType.COMPLIANCE_ASSESSMENT_COMPLETED,
        userId: 'user3',
        userName: 'Mike Johnson',
        metadata: { frameworkType: 'GDPR', complianceScore: 85 }
      },
      {
        type: ActivityType.CLIENT_STATUS_CHANGED,
        userId: 'user2',
        userName: 'Jane Smith',
        metadata: { 
          clientName: 'Global Industries',
          previousStatus: 'Questionnaire Pending',
          newStatus: 'In Review'
        }
      }
    ];

    // Add activities with slight time delays to show chronological order
    sampleActivities.forEach((activity, index) => {
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - (index * 30));
      
      const fullActivity: Activity = {
        id: this.generateId(),
        type: activity.type,
        userId: activity.userId,
        userName: activity.userName,
        description: this.generateDescription(activity.type, activity.userName, activity.metadata),
        metadata: activity.metadata,
        timestamp,
        icon: { name: ACTIVITY_CONFIG[activity.type].icon, type: 'lucide' },
        color: ACTIVITY_COLORS[ACTIVITY_CONFIG[activity.type].color]
      };

      this.activities.unshift(fullActivity);
    });

    this.saveActivities();
  }
}

// Export singleton instance
export const activityService = new ActivityService(); 