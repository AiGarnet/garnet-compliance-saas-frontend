import { createToast, Toast, ToastType } from '../../components/ui/Toast';

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
    type: ToastType;
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
  private toastCallbacks: Array<(toast: Omit<Toast, 'id' | 'timestamp'>) => void> = [];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';
  }

  /**
   * Register a callback to be called when toasts should be shown
   */
  onToast(callback: (toast: Omit<Toast, 'id' | 'timestamp'>) => void) {
    this.toastCallbacks.push(callback);
  }

  /**
   * Remove a toast callback
   */
  offToast(callback: (toast: Omit<Toast, 'id' | 'timestamp'>) => void) {
    this.toastCallbacks = this.toastCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Trigger toast notifications
   */
  private triggerToast(toast: Omit<Toast, 'id' | 'timestamp'>) {
    this.toastCallbacks.forEach(callback => callback(toast));
  }

  /**
   * Handle API response and automatically show toasts if configured
   */
  private handleApiResponse<T>(response: ApiResponse<T>): ApiResponse<T> {
    // Check if response contains activity data with toast config
    if (response.data && typeof response.data === 'object') {
      const data = response.data as any;
      
      // If this is an activity or contains toast config, show toast
      if (data.toastConfig || (response.meta && response.meta.operation)) {
        let toastConfig;
        
        if (data.toastConfig) {
          // Direct toast config from activity
          toastConfig = data.toastConfig;
        } else if (response.meta?.operation) {
          // Generate toast from operation metadata
          const operation = response.meta.operation;
          const entityType = response.meta.entityType || 'item';
          const entityName = data.name || response.meta.entityName || 'item';
          
          if (response.success) {
            switch (operation) {
              case 'create':
                toastConfig = createToast.success(
                  `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Created`,
                  `${entityName} has been created successfully`,
                  {
                    actions: data.id ? [{ 
                      label: 'View', 
                      action: `view_${entityType}_${data.id}`,
                      onClick: () => {
                        // Handle view action - this could navigate to the entity
                        console.log(`View ${entityType}:`, data.id);
                      }
                    }] : undefined
                  }
                );
                break;
              case 'update':
                toastConfig = createToast.success(
                  `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Updated`,
                  `${entityName} has been updated successfully`,
                  {
                    actions: data.id ? [{ 
                      label: 'View', 
                      action: `view_${entityType}_${data.id}`,
                      onClick: () => {
                        console.log(`View ${entityType}:`, data.id);
                      }
                    }] : undefined
                  }
                );
                break;
              case 'delete':
                toastConfig = createToast.success(
                  `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Deleted`,
                  `${entityName} has been deleted successfully`
                );
                break;
              default:
                toastConfig = createToast.success(
                  'Success',
                  `${operation.charAt(0).toUpperCase() + operation.slice(1)} completed successfully`
                );
            }
          } else {
            // Error toast for failed operations
            const errorMessage = response.error?.message || 'Operation failed';
            toastConfig = createToast.error(
              'Error',
              errorMessage,
              {
                duration: 7000,
                metadata: {
                  errorCode: response.error?.code,
                  details: response.error?.details
                }
              }
            );
          }
        }
        
        if (toastConfig) {
          this.triggerToast({
            ...toastConfig,
            activityId: data.id,
            metadata: {
              ...toastConfig.metadata,
              apiResponse: response.meta,
              timestamp: response.meta?.timestamp
            }
          });
        }
      }
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
      this.triggerToast(createToast.error(
        'Network Error',
        'Failed to connect to server. Please check your connection.',
        { duration: 7000 }
      ));

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
}

// Singleton instance
export const activityApiService = new ActivityApiService();

// Export for use in components
export default activityApiService; 