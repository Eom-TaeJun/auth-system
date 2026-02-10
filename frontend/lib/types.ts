/**
 * User type representing authenticated user data
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Auth response from login/register endpoints
 */
export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * API error response structure
 */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register credentials
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}
