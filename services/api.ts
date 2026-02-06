// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Generic fetch wrapper with error handling and retry logic
export const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second
  
  // Default headers
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only set Content-Type if it's not FormData (fetch handles FormData boundaries automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle rate limiting with retry
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.warn(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(endpoint, options, retryCount + 1);
    }
    
    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry the original request
          return apiClient(endpoint, options);
        } else {
          // Clear auth data and throw error
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          throw new APIError('Session expired. Please login again.', 401, data);
        }
      }
      
      throw new APIError(
        data.message || 'An error occurred',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or other errors
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0,
      null
    );
  }
};

// Refresh token function
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (data.success) {
      localStorage.setItem('access_token', data.data.token);
      localStorage.setItem('refresh_token', data.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// HTTP methods helpers
export const api = {
  get: (endpoint: string) => apiClient(endpoint, { method: 'GET' }),
  
  post: (endpoint: string, body: any) => 
    apiClient(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  
  put: (endpoint: string, body: any) => 
    apiClient(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),
  
  patch: (endpoint: string, body: any) => 
    apiClient(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    }),
  
  delete: (endpoint: string) => 
    apiClient(endpoint, { method: 'DELETE' }),

  upload: (endpoint: string, formData: FormData) =>
    apiClient(endpoint, {
      method: 'POST',
      body: formData,
    }),
};

export default api;
