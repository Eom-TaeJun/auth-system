/**
 * Tests for API interceptors and error handling
 * This file tests the request/response interceptors in isolation
 */

import type { AxiosResponse } from "axios";

const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
};

let requestInterceptor: any;
let responseInterceptor: any;
let responseErrorHandler: any;

jest.mock("axios", () => ({
  create: jest.fn(() => mockAxiosInstance),
}));

const getStoredAuthTokenMock = jest.fn();
const setStoredAuthTokenMock = jest.fn();
const clearStoredAuthTokenMock = jest.fn();

jest.mock("@/lib/authToken", () => ({
  getStoredAuthToken: (...args: unknown[]) => getStoredAuthTokenMock(...args),
  setStoredAuthToken: (...args: unknown[]) => setStoredAuthTokenMock(...args),
  clearStoredAuthToken: (...args: unknown[]) =>
    clearStoredAuthTokenMock(...args),
}));

describe("API interceptors", () => {
  beforeAll(() => {
    // Capture the interceptor functions
    mockAxiosInstance.interceptors.request.use.mockImplementation(
      (success, error) => {
        requestInterceptor = success;
        return 1;
      }
    );

    mockAxiosInstance.interceptors.response.use.mockImplementation(
      (success, error) => {
        responseInterceptor = success;
        responseErrorHandler = error;
        return 1;
      }
    );

    // Import the module to trigger interceptor registration
    require("@/lib/api");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("request interceptor", () => {
    it("adds authorization header when token exists", () => {
      getStoredAuthTokenMock.mockReturnValue("test-token");

      const config = {
        headers: {},
        url: "/api/test",
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe("Bearer test-token");
    });

    it("does not add authorization header when no token", () => {
      getStoredAuthTokenMock.mockReturnValue(null);

      const config = {
        headers: {},
        url: "/api/test",
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it("does not modify config when headers are not present", () => {
      getStoredAuthTokenMock.mockReturnValue("test-token");

      const config = {
        url: "/api/test",
      };

      const result = requestInterceptor(config);

      expect(result).toEqual(config);
    });
  });

  describe("response interceptor", () => {
    it("returns response unchanged on success", () => {
      const response: AxiosResponse = {
        data: { message: "Success" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      };

      const result = responseInterceptor(response);

      expect(result).toBe(response);
    });
  });

  describe("response error handler", () => {
    it("returns API error for response errors", async () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: "Bad Request",
            error: "VALIDATION_ERROR",
          },
        },
        config: {},
      };

      await expect(responseErrorHandler(error)).rejects.toEqual({
        message: "Bad Request",
        error: "VALIDATION_ERROR",
        details: undefined,
        statusCode: 400,
      });
    });

    it("returns network error when no response", async () => {
      const error = {
        request: {},
        config: {},
      };

      await expect(responseErrorHandler(error)).rejects.toEqual({
        message: "No response from server. Please check your connection.",
        statusCode: 0,
      });
    });

    it("returns generic error when neither response nor request", async () => {
      const error = {
        message: "Network Error",
        config: {},
      };

      await expect(responseErrorHandler(error)).rejects.toEqual({
        message: "Network Error",
        statusCode: 0,
      });
    });

    it("handles 401 errors and marks request as retried", async () => {
      const originalRequest = {
        url: "/api/users/me",
        headers: {},
        _retry: undefined,
      };

      const error = {
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
        config: originalRequest,
      };

      // Mock token refresh failure to avoid the api() call
      getStoredAuthTokenMock.mockReturnValue(null);
      mockAxiosInstance.post.mockRejectedValue(new Error("Refresh failed"));

      // This will attempt to refresh but fail
      await expect(responseErrorHandler(error)).rejects.toBeDefined();

      expect(originalRequest._retry).toBe(true);
    });

    it("does not retry 401 on auth endpoints", async () => {
      const originalRequest = {
        url: "/api/auth/login",
        headers: {},
        _retry: undefined,
      };

      const error = {
        response: {
          status: 401,
          data: { message: "Invalid credentials" },
        },
        config: originalRequest,
      };

      await expect(responseErrorHandler(error)).rejects.toEqual({
        message: "Invalid credentials",
        statusCode: 401,
      });

      expect(originalRequest._retry).toBeUndefined();
    });

    it("does not retry when already retried", async () => {
      const originalRequest = {
        url: "/api/users/me",
        headers: {},
        _retry: true,
      };

      const error = {
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
        config: originalRequest,
      };

      await expect(responseErrorHandler(error)).rejects.toEqual({
        message: "Unauthorized",
        statusCode: 401,
      });
    });
  });
});
