// Base API URL - adjust based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * Create headers with authentication
 */
function createHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Generic API client for making HTTP requests with authentication
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: createHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        const error = new Error('Authentication required. Please log in.');
        error.name = 'AuthenticationError';
        throw error;
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      const error = new Error(errorData.error?.message || errorData.message || errorData.error || `API error: ${response.status}`);
      // Preserve the response structure for detailed error handling
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }

    return response.json();
  },

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        const error = new Error('Authentication required. Please log in.');
        error.name = 'AuthenticationError';
        throw error;
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      const error = new Error(errorData.error?.message || errorData.message || errorData.error || `API error: ${response.status}`);
      // Preserve the response structure for detailed error handling
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }

    return response.json();
  },

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        const error = new Error('Authentication required. Please log in.');
        error.name = 'AuthenticationError';
        throw error;
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      const error = new Error(errorData.error?.message || errorData.message || errorData.error || `API error: ${response.status}`);
      // Preserve the response structure for detailed error handling
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }

    return response.json();
  },

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        const error = new Error('Authentication required. Please log in.');
        error.name = 'AuthenticationError';
        throw error;
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      const error = new Error(errorData.error?.message || errorData.message || errorData.error || `API error: ${response.status}`);
      // Preserve the response structure for detailed error handling
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }

    return response.json();
  },
}; 