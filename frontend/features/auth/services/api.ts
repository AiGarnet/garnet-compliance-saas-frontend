import { apiCall } from '@/lib/api';

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  organization?: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization?: string;
  created_at: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
  token?: string; // For backward compatibility
}

/**
 * Authentication API service
 */
export const auth = {
  /**
   * User login
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * User signup
   */
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    return apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Get user profile (replaces verifyToken)
   */
  async getProfile(token: string): Promise<{ user: User }> {
    return apiCall('/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  /**
   * Verify token validity using profile endpoint
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      await this.getProfile(token);
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  },

  /**
   * Get current user profile from localStorage token
   */
  async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
      const response = await this.getProfile(token);
      return response.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Clear invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      return null;
    }
  },

  /**
   * Logout user (if backend logout is needed)
   */
  async logout(): Promise<void> {
    try {
      // If your backend has a logout endpoint, call it here
      // await apiCall('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout as it should always succeed locally
    }
  },

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiCall('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Token refresh failed');
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      const response = await apiCall('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return response;
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Password reset request failed');
    }
  },

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiCall('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: newPassword }),
      });
      return response;
    } catch (error) {
      console.error('Password reset failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  },
}; 