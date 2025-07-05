import { getApiEndpoint } from '@/lib/api';

/**
 * Get the stored auth token
 */
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

/**
 * API Client for making HTTP requests
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = getApiEndpoint(endpoint);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token && !endpoint.includes('/api/auth/')) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = getApiEndpoint(endpoint);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token && !endpoint.includes('/api/auth/')) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = getApiEndpoint(endpoint);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token && !endpoint.includes('/api/auth/')) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = getApiEndpoint(endpoint);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token && !endpoint.includes('/api/auth/')) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}; 