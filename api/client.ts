/**
 * API Client for Promise Point Agrictech Solution Backend
 */

import { getAuthToken, clearAuthToken } from '../utils/cookies';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export class ApiClient {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(baseUrl: string = API_BASE_URL, maxRetries: number = 3, retryDelay: number = 1000) {
    this.baseUrl = baseUrl;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shouldRetry(status: number, attempt: number): boolean {
    // Don't retry on 401 (auth errors) or 4xx client errors (except 429 - rate limit)
    if (status === 401 || (status >= 400 && status < 500 && status !== 429)) {
      return false;
    }
    // Retry on 5xx server errors, network errors, and 429 rate limits
    return attempt < this.maxRetries;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryAttempt: number = 0
  ): Promise<T> {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Handle 401 Unauthorized - clear token and throw specific error (no retry)
        if (response.status === 401) {
          clearAuthToken();
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          
          try {
            const errorData: ApiError = await response.json();
            throw new Error(errorData.message || errorData.error || 'Invalid or expired token');
          } catch {
            throw new Error('Invalid or expired token');
          }
        }

        // Check if we should retry
        if (this.shouldRetry(response.status, retryAttempt)) {
          const delay = this.retryDelay * Math.pow(2, retryAttempt); // Exponential backoff
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryAttempt + 1);
        }

        // Handle other errors (no retry)
        try {
          const errorData: ApiError = await response.json();
          throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText || 'An error occurred'}`);
        }
      }

      return await response.json();
    } catch (error) {
      // Retry on network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (this.shouldRetry(0, retryAttempt)) {
          const delay = this.retryDelay * Math.pow(2, retryAttempt);
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryAttempt + 1);
        }
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = getAuthToken();
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthToken();
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          throw new Error('Invalid or expired token');
        }

        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Upload failed');
    }
  }
}

export const apiClient = new ApiClient();
