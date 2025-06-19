import { apiCall } from '@/services/api';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token?: string; // For compatibility
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    organization?: string;
    created_at: string;
  };
}

interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  organization?: string;
}

interface SignupResponse {
  message: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    organization?: string;
    created_at: string;
  };
}

/**
 * Authentication API service
 */
export const auth = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  },

  /**
   * Sign up new user
   */
  async signup(userData: SignupRequest): Promise<SignupResponse> {
    try {
      const response = await apiCall('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response;
    } catch (error) {
      console.error('Signup failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Signup failed');
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
   * Verify token validity
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      await apiCall('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  },

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
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