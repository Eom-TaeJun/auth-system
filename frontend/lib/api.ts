import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type {
  ApiError,
  ApiResponse,
  ForgotPasswordRequest,
  LoginCredentials,
  LoginResponse,
  MessageResponse,
  RefreshResponse,
  RegisterCredentials,
  RegisterResponse,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
} from "./types";
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from "./authToken";

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

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Request interceptor - adds auth token to requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles errors and token refresh.
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
        }
        return api(originalRequest);
      }
    }

    if (error.response) {
      return Promise.reject(toApiError(error));
    }

    if (error.request) {
      return Promise.reject({
        message: "No response from server. Please check your connection.",
        statusCode: 0,
      } as ApiError);
    }

    return Promise.reject({
      message: error.message || "Request failed",
      statusCode: 0,
    } as ApiError);
  }
);

/**
 * Helper function to handle API responses consistently
 */
export async function handleApiResponse<T>(
  promise: Promise<AxiosResponse<T>>
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

export const authApi = {
  register(payload: RegisterCredentials): Promise<AxiosResponse<RegisterResponse>> {
    return api.post<RegisterResponse>("/api/auth/register", payload);
  },

  login(payload: LoginCredentials): Promise<AxiosResponse<LoginResponse>> {
    return api.post<LoginResponse>("/api/auth/login", payload, {
      withCredentials: true,
    });
  },

  verifyEmail(token: string): Promise<AxiosResponse<MessageResponse>> {
    return api.get<MessageResponse>("/api/auth/verify-email", {
      params: { token },
    });
  },

  forgotPassword(payload: ForgotPasswordRequest): Promise<AxiosResponse<MessageResponse>> {
    return api.post<MessageResponse>("/api/auth/forgot-password", payload);
  },

  resetPassword(payload: ResetPasswordRequest): Promise<AxiosResponse<MessageResponse>> {
    return api.post<MessageResponse>("/api/auth/reset-password", payload);
  },

  refresh(): Promise<AxiosResponse<RefreshResponse>> {
    return api.post<RefreshResponse>(
      "/api/auth/refresh",
      {},
      { withCredentials: true }
    );
  },

  logout(): Promise<AxiosResponse<MessageResponse>> {
    return api.post<MessageResponse>(
      "/api/auth/logout",
      {},
      { withCredentials: true }
    );
  },
};

export const userApi = {
  me(): Promise<AxiosResponse<User>> {
    return api.get<User>("/api/users/me");
  },

  updateMe(payload: UpdateProfileRequest): Promise<AxiosResponse<User>> {
    return api.patch<User>("/api/users/me", payload);
  },
};

function toApiError(error: AxiosError<ApiError>): ApiError {
  return {
    message: error.response?.data?.message || "An error occurred",
    error: error.response?.data?.error,
    details: error.response?.data?.details,
    statusCode: error.response?.status,
  };
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await authApi.refresh();
      const newToken = response.data.accessToken;

      setStoredAuthToken(newToken);

      return newToken;
    } catch {
      clearStoredAuthToken();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) {
    return false;
  }

  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/register") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/logout")
  );
}

export default api;
