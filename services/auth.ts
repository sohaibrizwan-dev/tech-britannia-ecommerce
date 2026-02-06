import { User, AuthResponse } from '../types';
import { api } from './api';

export const authService = {
  // Register new user
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      // Store tokens
      const { user, token, refreshToken } = response.data;
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_data', JSON.stringify(user));

      return { user, token, refreshToken };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during registration');
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }

      // Store tokens
      const { user, token, refreshToken } = response.data;
      localStorage.setItem('access_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_data', JSON.stringify(user));

      return { user, token, refreshToken };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during login');
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      // Call backend logout endpoint
      const token = localStorage.getItem('access_token');
      if (token) {
        await api.post('/auth/logout', {});
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    }
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  // Verify token with backend
  checkSession: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return false;

      const response = await api.get('/auth/me');
      return response.success;
    } catch {
      return false;
    }
  },

  // Get user profile from backend
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch profile');
    }
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    const response = await api.put('/users/profile', data);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }
    
    // Update localStorage with new user data
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
    
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await api.put('/users/change-password', {
      currentPassword,
      newPassword,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  },

  // Refresh token
  refreshToken: async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.success) {
        localStorage.setItem('access_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};

export default authService;
