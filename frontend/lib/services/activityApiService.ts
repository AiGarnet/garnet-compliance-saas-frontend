import { showToast } from '../../components/ui/Toast';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

export interface BackendActivity {
  id: string;
  type: string;
  status: 'success' | 'pending' | 'failed' | 'in_progress';
  description: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  entityId?: string;
  entityType?: string;
  entityName?: string;
  metadata?: Record<string, any>;
  toastConfig?: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    showProgress?: boolean;
    actions?: Array<{ label: string; action: string; }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFilters {
  userId?: string;
  type?: string | string[];
  status?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

class ActivityApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';
  }

  /**
   * Trigger toast notifications
   */
  private triggerToast(toastConfig: any): void {
    // Show toast notification
    showToast(toastConfig.message, toastConfig.type, toastConfig.duration);
  }

  /**
   * Update an existing activity
   */
  async updateActivity(activityId: string, updates: Partial<BackendActivity>): Promise<ApiResponse<BackendActivity>> {
    return this.request<BackendActivity>(`/api/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Update activity status with automatic toasts
   */
  async updateActivityStatus(
    activityId: string, 
    status: 'success' | 'pending' | 'failed' | 'in_progress'
  ): Promise<ApiResponse<BackendActivity>> {
    const response = await this.updateActivity(activityId, { status });
    
    if (response.success && response.data) {
      const activity = response.data;
      const statusMessage = status === 'success' ? 'completed successfully' : 
                           status === 'failed' ? 'failed' : 
                           status === 'in_progress' ? 'is in progress' : 'is pending';
      
      showToast(`${activity.description} ${statusMessage}`, status === 'success' ? 'success' : 'info');
    }
    
    return response;
  }

  /**
   * Handle API response with automatic toast notifications
   */
  handleApiResponse<T>(
    response: ApiResponse<T>, 
    operation: string = 'operation',
    options: { showSuccessToast?: boolean; showErrorToast?: boolean } = {}
  ): ApiResponse<T> {
    const { showSuccessToast = true, showErrorToast = true } = options;
    
    if (response.success) {
      if (showSuccessToast) {
        showToast(`${operation.charAt(0).toUpperCase() + operation.slice(1)} completed successfully`, 'success');
      }
    } else if (showErrorToast) {
      const errorMessage = response.error?.message || `${operation} failed`;
      showToast(errorMessage, 'error', 7000);
    }
    
    return response;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Add auth token if available (check for browser environment)
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>)
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('No auth token found for API request:', endpoint);
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // Include cookies for CORS
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses (likely error pages)
        const text = await response.text();
        console.warn('Non-JSON response received:', text);
        
        if (response.status === 401) {
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required. Please log in again.',
              details: { status: response.status, text }
            },
            meta: {
              timestamp: new Date().toISOString()
            }
          };
        }
        
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Server returned invalid response format',
            details: { status: response.status, text }
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        };
      }
      
      // Handle HTTP error status codes
      if (!response.ok) {
        if (response.status === 401) {
          // Clear auth tokens on 401
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
          }
          
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication expired. Please log in again.',
              details: data
            },
            meta: {
              timestamp: new Date().toISOString()
            }
          };
        }
        
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data?.message || `HTTP ${response.status} error`,
            details: data
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        };
      }
      
      // Ensure we return a proper ApiResponse format
      const apiResponse: ApiResponse<T> = data?.success !== undefined ? data : {
        success: true,
        data: data,
        meta: {
          timestamp: new Date().toISOString()
        }
      };
      
      // Handle the response and show toasts
      return this.handleApiResponse(apiResponse);
    } catch (error) {
      const errorResponse: ApiResponse<T> = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
          details: error
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      // Show error toast
      this.triggerToast({
        title: 'Network Error',
        message: 'Failed to connect to server. Please check your connection.',
        type: 'error',
        duration: 7000
      });

      return errorResponse;
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit?: number, userId?: string): Promise<ApiResponse<BackendActivity[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (userId) params.append('userId', userId);

    return this.request<BackendActivity[]>(`/api/activities/recent?${params.toString()}`);
  }

  /**
   * Get activities with filters
   */
  async getActivities(filters: ActivityFilters = {}): Promise<ApiResponse<BackendActivity[]>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, value.toString());
        }
      }
    });

    return this.request<BackendActivity[]>(`/api/activities?${params.toString()}`);
  }

  /**
   * Get activity summary
   */
  async getActivitySummary(userId?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);

    return this.request<any>(`/api/activities/summary?${params.toString()}`);
  }

  /**
   * Get activity by ID
   */
  async getActivity(id: string): Promise<ApiResponse<BackendActivity>> {
    return this.request<BackendActivity>(`/api/activities/${id}`);
  }

  /**
   * Get activity types for filtering
   */
  async getActivityTypes(): Promise<ApiResponse<{ types: string[]; statuses: string[]; }>> {
    return this.request<{ types: string[]; statuses: string[]; }>('/api/activities/meta/types');
  }

  /**
   * Vendor/Client operations with automatic activity logging
   */
  
  async createVendor(vendorData: any): Promise<ApiResponse<any>> {
    return this.request('/api/vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData)
    });
  }

  async updateVendor(id: string, vendorData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vendorData)
    });
  }

  async deleteVendor(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/vendors/${id}`, {
      method: 'DELETE'
    });
  }

  async getVendors(): Promise<ApiResponse<any[]>> {
    // Get organization_id from user data for filtering
    let organizationId: string | undefined;
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          organizationId = user.organization_id;
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
    }
    
    const params = new URLSearchParams();
    if (organizationId) {
      params.append('organization_id', organizationId);
    }
    
    const url = `/api/vendors${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request(url);
  }

  async getVendor(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/vendors/${id}`);
  }

  /**
   * Questionnaire operations
   */
  
  async createQuestionnaire(questionnaireData: any): Promise<ApiResponse<any>> {
    return this.request('/api/questionnaires', {
      method: 'POST',
      body: JSON.stringify(questionnaireData)
    });
  }

  async submitQuestionnaire(id: string, answers: any): Promise<ApiResponse<any>> {
    return this.request(`/api/questionnaires/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(answers)
    });
  }

  /**
   * Evidence operations
   */
  
  async uploadEvidence(evidenceData: FormData): Promise<ApiResponse<any>> {
    // Don't set Content-Type for FormData - let browser set it with boundary
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }
    
    const headers: Record<string, string> = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/evidence`, {
      method: 'POST',
      headers,
      body: evidenceData
    });

    const data = await response.json();
    return this.handleApiResponse(data);
  }

  /**
   * Start polling for real-time activity updates
   */
  startActivityPolling(intervalMs: number = 30000, userId?: string) {
    return setInterval(async () => {
      try {
        const response = await this.getRecentActivities(5, userId);
        
        // Check for new activities that might have toast configs
        if (response.success && response.data) {
          response.data.forEach(activity => {
            if (activity.toastConfig && activity.status === 'success') {
              // Only show toasts for recent activities (within last 2 minutes)
              const activityTime = new Date(activity.createdAt).getTime();
              const now = new Date().getTime();
              const twoMinutes = 2 * 60 * 1000;
              
              if (now - activityTime < twoMinutes) {
                this.triggerToast({
                  ...activity.toastConfig,
                  activityId: activity.id,
                  metadata: {
                    activityData: activity,
                    isPolled: true
                  }
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Activity polling error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop activity polling
   */
  stopActivityPolling(intervalId: NodeJS.Timeout) {
    clearInterval(intervalId);
  }

  /**
   * Create activity with automatic toast notification
   */
  async createActivityWithToast(
    operation: string,
    entityType: string,
    data: any,
    options: {
      showToast?: boolean;
      toastDuration?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<ApiResponse<BackendActivity>> {
    const { showToast: shouldShowToast = true, toastDuration = 4000 } = options;

    try {
      const activity = {
        type: `${entityType}_${operation}`,
        entityType,
        entityId: data.id?.toString(),
        entityName: data.name || data.title || `${entityType} ${data.id}`,
        description: `${operation.charAt(0).toUpperCase() + operation.slice(1)} ${entityType}: ${data.name || data.id}`,
        metadata: {
          operation,
          ...options.metadata,
          ...(data.metadata || {})
        }
      };

      const response = await this.request<BackendActivity>('/api/activities', {
        method: 'POST',
        body: JSON.stringify(activity)
      });
      
      if (shouldShowToast && response.success && response.data) {
        const { data: activityData } = response;
        const entityName = data.name || data.title || `${entityType} ${data.id}`;
        
        // Show appropriate toast based on operation
        switch (operation) {
          case 'create':
            showToast(`${entityName} has been created successfully`, 'success', toastDuration);
            break;
          case 'update':
            showToast(`${entityName} has been updated successfully`, 'success', toastDuration);
            break;
          case 'delete':
            showToast(`${entityName} has been deleted successfully`, 'success', toastDuration);
            break;
          default:
            showToast(`${operation.charAt(0).toUpperCase() + operation.slice(1)} completed successfully`, 'success', toastDuration);
        }
      }

      return response;
    } catch (error) {
      console.error(`Failed to create activity for ${operation} ${entityType}:`, error);
      
      if (shouldShowToast) {
        const errorMessage = error instanceof Error ? error.message : 'Operation failed';
        showToast(errorMessage, 'error', 7000);
      }
      
      return {
        success: false,
        error: {
          code: 'ACTIVITY_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create activity',
          details: error
        }
      };
    }
  }
}

// Singleton instance
export const activityApiService = new ActivityApiService();

// Export for use in components
export default activityApiService; 