import { renderHook, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import type { LoginCredentials, RegisterCredentials, User } from "@/lib/types";

const authApiLoginMock = jest.fn();
const authApiRegisterMock = jest.fn();
const authApiLogoutMock = jest.fn();
const authApiRefreshMock = jest.fn();
const userApiMeMock = jest.fn();
const handleApiResponseMock = jest.fn();
const getStoredAuthTokenMock = jest.fn();
const setStoredAuthTokenMock = jest.fn();
const clearStoredAuthTokenMock = jest.fn();

jest.mock("@/lib/api", () => ({
  authApi: {
    login: (...args: unknown[]) => authApiLoginMock(...args),
    register: (...args: unknown[]) => authApiRegisterMock(...args),
    logout: (...args: unknown[]) => authApiLogoutMock(...args),
    refresh: (...args: unknown[]) => authApiRefreshMock(...args),
  },
  userApi: {
    me: (...args: unknown[]) => userApiMeMock(...args),
  },
  handleApiResponse: (...args: unknown[]) => handleApiResponseMock(...args),
}));

jest.mock("@/lib/authToken", () => ({
  getStoredAuthToken: (...args: unknown[]) => getStoredAuthTokenMock(...args),
  setStoredAuthToken: (...args: unknown[]) => setStoredAuthTokenMock(...args),
  clearStoredAuthToken: (...args: unknown[]) =>
    clearStoredAuthTokenMock(...args),
}));

const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  email_verified: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("useAuth hook", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    getStoredAuthTokenMock.mockReturnValue(null);
    handleApiResponseMock.mockImplementation((promise) => promise);
  });

  it("throws error when used outside AuthProvider", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleError.mockRestore();
  });

  it("initializes with loading state and no user", () => {
    authApiRefreshMock.mockResolvedValue({ data: { accessToken: "token" } });
    userApiMeMock.mockResolvedValue({ data: mockUser });
    handleApiResponseMock.mockImplementation(async (promise) => {
      const result = await promise;
      return { success: true, data: result.data };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("loads user on mount when access token exists", async () => {
    getStoredAuthTokenMock.mockReturnValue("existing-token");
    userApiMeMock.mockResolvedValue({ data: mockUser });
    handleApiResponseMock.mockImplementation(async (promise) => {
      const result = await promise;
      return { success: true, data: result.data };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(userApiMeMock).toHaveBeenCalled();
  });

  it("refreshes token and loads user when no access token exists", async () => {
    getStoredAuthTokenMock.mockReturnValue(null);
    authApiRefreshMock.mockResolvedValue({ data: { accessToken: "new-token" } });
    userApiMeMock.mockResolvedValue({ data: mockUser });
    handleApiResponseMock.mockImplementation(async (promise) => {
      const result = await promise;
      return { success: true, data: result.data };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(authApiRefreshMock).toHaveBeenCalled();
    expect(setStoredAuthTokenMock).toHaveBeenCalledWith("new-token");
    expect(result.current.user).toEqual(mockUser);
  });

  it("clears auth state when refresh fails", async () => {
    getStoredAuthTokenMock.mockReturnValue(null);
    handleApiResponseMock.mockImplementation(async (promise) => {
      try {
        await promise;
      } catch {
        return { success: false, error: { message: "Refresh failed" } };
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(clearStoredAuthTokenMock).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
  });

  it("clears auth state when user fetch fails", async () => {
    getStoredAuthTokenMock.mockReturnValue("valid-token");
    handleApiResponseMock.mockImplementation(async (promise) => {
      try {
        await promise;
      } catch {
        return { success: false, error: { message: "Unauthorized" } };
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(clearStoredAuthTokenMock).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
  });

  it("logs in successfully and sets user state", async () => {
    getStoredAuthTokenMock.mockReturnValue(null);

    // Mock for initialization (refresh fails)
    authApiRefreshMock.mockRejectedValueOnce(new Error("No refresh token"));
    handleApiResponseMock.mockImplementation(async (promise) => {
      try {
        const result = await promise;
        return { success: true, data: result.data };
      } catch {
        return { success: false };
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const credentials: LoginCredentials = {
      email: "test@example.com",
      password: "password123",
    };

    authApiLoginMock.mockResolvedValue({
      data: { accessToken: "login-token", user: mockUser },
    });

    await act(async () => {
      await result.current.login(credentials);
    });

    expect(authApiLoginMock).toHaveBeenCalledWith(credentials);
    expect(setStoredAuthTokenMock).toHaveBeenCalledWith("login-token");
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("throws error when login fails", async () => {
    getStoredAuthTokenMock.mockReturnValue(null);

    // Mock for initialization
    authApiRefreshMock.mockRejectedValueOnce(new Error("No refresh token"));
    handleApiResponseMock.mockImplementation(async (promise) => {
      try {
        const result = await promise;
        return { success: true, data: result.data };
      } catch {
        return { success: false };
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const credentials: LoginCredentials = {
      email: "test@example.com",
      password: "wrong-password",
    };

    // Mock login failure
    handleApiResponseMock.mockResolvedValueOnce({
      success: false,
      error: { message: "Invalid credentials" },
    });

    await expect(result.current.login(credentials)).rejects.toThrow(
      "Invalid credentials"
    );
  });

  it("registers successfully without setting user state", async () => {
    getStoredAuthTokenMock.mockReturnValue(null);

    // Mock for initialization
    authApiRefreshMock.mockRejectedValueOnce(new Error("No refresh token"));
    handleApiResponseMock.mockImplementation(async (promise) => {
      try {
        const result = await promise;
        return { success: true, data: result.data };
      } catch {
        return { success: false };
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const credentials: RegisterCredentials = {
      email: "newuser@example.com",
      password: "password123",
    };

    authApiRegisterMock.mockResolvedValue({
      data: { message: "Registration successful" },
    });

    await act(async () => {
      await result.current.register(credentials);
    });

    expect(authApiRegisterMock).toHaveBeenCalledWith(credentials);
    expect(result.current.user).toBe(null);
  });

  it("throws error when registration fails", async () => {
    getStoredAuthTokenMock.mockReturnValue(null);

    // Mock for initialization
    authApiRefreshMock.mockRejectedValueOnce(new Error("No refresh token"));
    handleApiResponseMock.mockImplementation(async (promise) => {
      try {
        const result = await promise;
        return { success: true, data: result.data };
      } catch {
        return { success: false };
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const credentials: RegisterCredentials = {
      email: "existing@example.com",
      password: "password123",
    };

    // Mock registration failure
    handleApiResponseMock.mockResolvedValueOnce({
      success: false,
      error: { message: "Email already exists" },
    });

    await expect(result.current.register(credentials)).rejects.toThrow(
      "Email already exists"
    );
  });

  it("logs out and clears auth state", async () => {
    getStoredAuthTokenMock.mockReturnValue("token");
    userApiMeMock.mockResolvedValue({ data: mockUser });
    handleApiResponseMock.mockImplementation(async (promise) => {
      const result = await promise;
      return { success: true, data: result.data };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    authApiLogoutMock.mockResolvedValue({});

    await act(async () => {
      await result.current.logout();
    });

    expect(authApiLogoutMock).toHaveBeenCalled();
    expect(clearStoredAuthTokenMock).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("refreshes user data successfully", async () => {
    getStoredAuthTokenMock.mockReturnValue("token");
    userApiMeMock
      .mockResolvedValueOnce({ data: mockUser })
      .mockResolvedValueOnce({
        data: { ...mockUser, email: "updated@example.com" },
      });
    handleApiResponseMock.mockImplementation(async (promise) => {
      const result = await promise;
      return { success: true, data: result.data };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user?.email).toBe("updated@example.com");
  });

  it("clears auth state when refreshUser fails", async () => {
    getStoredAuthTokenMock.mockReturnValue("token");

    // First call for initialization - successful
    userApiMeMock.mockResolvedValueOnce({ data: mockUser });
    handleApiResponseMock.mockImplementation(async (promise) => {
      const result = await promise;
      return { success: true, data: result.data };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    // Second call for refreshUser - fails
    handleApiResponseMock.mockResolvedValueOnce({ success: false });

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(clearStoredAuthTokenMock).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
  });
});
