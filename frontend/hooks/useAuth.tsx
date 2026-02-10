"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, LoginCredentials, RegisterCredentials } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token on mount
    // This will be implemented in Phase 6
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          // TODO: Validate token and fetch user data in Phase 6
          // For now, just set loading to false
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    // Stub function - will be implemented in Phase 6
    console.log("Login stub called with:", credentials.email);
    throw new Error("Login not yet implemented");
  };

  const register = async (credentials: RegisterCredentials) => {
    // Stub function - will be implemented in Phase 6
    console.log("Register stub called with:", credentials.email);
    throw new Error("Register not yet implemented");
  };

  const logout = () => {
    // Stub function - will be implemented in Phase 6
    console.log("Logout stub called");
    setUser(null);
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
