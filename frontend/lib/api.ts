import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiError, ApiResponse } from "./types";

/**
 * Axios instance configured for API calls
 */
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

/**
 * Request interceptor - adds auth token to requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (will be implemented in Phase 6)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles errors and token refresh (stub for Phase 6)
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle common error cases
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        message: error.response.data?.message || "An error occurred",
        errors: error.response.data?.errors,
        statusCode: error.response.status,
      };

      // Handle 401 Unauthorized (will add logout logic in Phase 6)
      if (error.response.status === 401) {
        // Redirect to login or refresh token
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          // Will dispatch logout event in Phase 6
        }
      }

      return Promise.reject(apiError);
    } else if (error.request) {
      // Request made but no response received
      return Promise.reject({
        message: "No response from server. Please check your connection.",
        statusCode: 0,
      });
    } else {
      // Error setting up request
      return Promise.reject({
        message: error.message || "Request failed",
        statusCode: 0,
      });
    }
  }
);

/**
 * Helper function to handle API responses consistently
 */
export async function handleApiResponse<T>(
  promise: Promise<any>
): Promise<ApiResponse<T>> {
  try {
    const response = await promise;
    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    return {
      error: error as ApiError,
      success: false,
    };
  }
}

export default api;
