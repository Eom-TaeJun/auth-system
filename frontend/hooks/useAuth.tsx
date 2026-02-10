"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, LoginCredentials, RegisterCredentials } from "@/lib/types";
import { authApi, handleApiResponse, userApi } from "@/lib/api";
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from "@/lib/authToken";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    clearStoredAuthToken();
    setUser(null);
  };

  const fetchCurrentUser = async (): Promise<User | null> => {
    const result = await handleApiResponse(userApi.me());
    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  };

  const ensureAccessToken = async (): Promise<boolean> => {
    if (getStoredAuthToken()) {
      return true;
    }

    const refreshResult = await handleApiResponse(authApi.refresh());
    if (!refreshResult.success || !refreshResult.data) {
      return false;
    }

    setStoredAuthToken(refreshResult.data.accessToken);
    return true;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const hasAccessToken = await ensureAccessToken();
        if (!hasAccessToken) {
          clearAuthState();
          return;
        }

        const currentUser = await fetchCurrentUser();
        if (!currentUser) {
          clearAuthState();
          return;
        }

        setUser(currentUser);
      } catch (error) {
        console.error("Auth check failed:", error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const result = await handleApiResponse(authApi.login(credentials));

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || "Login failed");
    }

    setStoredAuthToken(result.data.accessToken);
    setUser(result.data.user);
  };

  const register = async (credentials: RegisterCredentials) => {
    const result = await handleApiResponse(authApi.register(credentials));

    if (!result.success) {
      throw new Error(result.error?.message || "Registration failed");
    }
  };

  const logout = async () => {
    await handleApiResponse(authApi.logout());
    clearAuthState();
  };

  const refreshUser = async () => {
    const currentUser = await fetchCurrentUser();
    if (!currentUser) {
      clearAuthState();
      return;
    }

    setUser(currentUser);
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
