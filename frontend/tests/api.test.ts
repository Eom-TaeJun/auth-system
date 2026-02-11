import type { AxiosResponse } from "axios";
import type {
  LoginCredentials,
  RegisterCredentials,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
} from "@/lib/types";

const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

jest.mock("axios", () => ({
  create: jest.fn(() => mockAxiosInstance),
}));

jest.mock("@/lib/authToken", () => ({
  getStoredAuthToken: jest.fn(),
  setStoredAuthToken: jest.fn(),
  clearStoredAuthToken: jest.fn(),
}));

// Import after mocks are set up
const { authApi, userApi, handleApiResponse } = require("@/lib/api");

describe("API module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleApiResponse", () => {
    it("returns success response when promise resolves", async () => {
      const mockData = { message: "Success" };
      const mockResponse: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      };

      const result = await handleApiResponse(Promise.resolve(mockResponse));

      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });

    it("returns error response when promise rejects", async () => {
      const mockError = {
        message: "Request failed",
        statusCode: 400,
      };

      const result = await handleApiResponse(Promise.reject(mockError));

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });
  });

  describe("authApi", () => {
    beforeEach(() => {
      mockAxiosInstance.post.mockClear();
      mockAxiosInstance.get.mockClear();
      mockAxiosInstance.patch.mockClear();
    });

    it("calls register endpoint with credentials", async () => {
      const credentials: RegisterCredentials = {
        email: "test@example.com",
        password: "password123",
      };
      const mockResponse = {
        data: { message: "Registration successful" },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authApi.register(credentials);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/auth/register",
        credentials
      );
      expect(result.data).toEqual(mockResponse.data);
    });

    it("calls login endpoint with credentials and withCredentials", async () => {
      const credentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
      };
      const mockResponse = {
        data: {
          accessToken: "token",
          user: { id: "1", email: "test@example.com" },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authApi.login(credentials);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/auth/login",
        credentials,
        { withCredentials: true }
      );
      expect(result.data).toEqual(mockResponse.data);
    });

    it("calls verifyEmail endpoint with token param", async () => {
      const token = "verify-token-123";
      const mockResponse = {
        data: { message: "Email verified" },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authApi.verifyEmail(token);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/auth/verify-email",
        { params: { token } }
      );
      expect(result.data).toEqual(mockResponse.data);
    });

    it("calls forgotPassword endpoint with email", async () => {
      const payload: ForgotPasswordRequest = {
        email: "test@example.com",
      };
      const mockResponse = {
        data: { message: "Reset link sent" },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authApi.forgotPassword(payload);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/auth/forgot-password",
        payload
      );
      expect(result.data).toEqual(mockResponse.data);
    });

    it("calls resetPassword endpoint with token and password", async () => {
      const payload: ResetPasswordRequest = {
        token: "reset-token",
        password: "newpassword123",
      };
      const mockResponse = {
        data: { message: "Password reset successfully" },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authApi.resetPassword(payload);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/auth/reset-password",
        payload
      );
      expect(result.data).toEqual(mockResponse.data);
    });

    it("calls refresh endpoint with withCredentials", async () => {
      const mockResponse = {
        data: { accessToken: "new-token" },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authApi.refresh();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/auth/refresh",
        {},
        { withCredentials: true }
      );
      expect(result.data).toEqual(mockResponse.data);
    });

    it("calls logout endpoint with withCredentials", async () => {
      const mockResponse = {
        data: { message: "Logged out" },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authApi.logout();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/auth/logout",
        {},
        { withCredentials: true }
      );
      expect(result.data).toEqual(mockResponse.data);
    });
  });

  describe("userApi", () => {
    beforeEach(() => {
      mockAxiosInstance.get.mockClear();
      mockAxiosInstance.patch.mockClear();
    });

    it("calls me endpoint to get current user", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        email_verified: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };
      const mockResponse = { data: mockUser };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await userApi.me();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/users/me");
      expect(result.data).toEqual(mockUser);
    });

    it("calls updateMe endpoint with profile data", async () => {
      const payload: UpdateProfileRequest = {
        email: "newemail@example.com",
      };
      const mockUser = {
        id: "1",
        email: "newemail@example.com",
        email_verified: false,
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };
      const mockResponse = { data: mockUser };

      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await userApi.updateMe(payload);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/api/users/me",
        payload
      );
      expect(result.data).toEqual(mockUser);
    });
  });

});
