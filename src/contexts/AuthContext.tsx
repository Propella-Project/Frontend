/**
 * Auth Context - Cookie & Token Based Authentication
 * 
 * This context manages authentication state for the Propella Dashboard.
 * Supports both cookie-based (primary) and localStorage token-based (fallback) auth.
 * 
 * Backend API: https://api.propella.ng
 * Landing Page: https://propella.ng
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ENV } from "@/config/env";

// Token storage keys (must match landing page)
const TOKEN_KEY = "propella_token";
const REFRESH_TOKEN_KEY = "propella_refresh_token";
const USER_ID_KEY = "propella_user_id";

// User type from backend
export interface User {
  id: string;
  email: string;
  username?: string;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  referral_code?: string;
  referral_points?: number;
  total_referrals?: number;
  is_verified?: boolean;
  date_joined?: string;
  phone_number?: string;
  avatar?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  token: string | null;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

// API base URL
const API_BASE_URL = ENV.API_BASE_URL.replace(/\/api$/, '');

// Get token from localStorage
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Get refresh token from localStorage
function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * Get auth headers for API calls
   */
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const currentToken = token || getStoredToken();
    if (currentToken) {
      return {
        "Authorization": `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      };
    }
    return {
      "Content-Type": "application/json",
    };
  }, [token]);

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/token/refresh/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.access) {
        localStorage.setItem(TOKEN_KEY, data.access);
        setToken(data.access);
        return data.access;
      }
    } catch (err) {
      console.error("[Auth] Token refresh failed:", err);
    }
    return null;
  }, []);

  /**
   * Check if user is authenticated
   * Tries cookie auth first, falls back to token auth
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Try cookie-based auth first (primary method)
      const response = await fetch(`${API_BASE_URL}/api/accounts/me/`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Also sync localStorage for consistency
        if (userData.id) {
          localStorage.setItem(USER_ID_KEY, userData.id);
        }
        
        return true;
      }

      // If cookie auth fails (401), try token refresh
      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetch(`${API_BASE_URL}/api/accounts/me/`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${newToken}`,
            },
          });

          if (retryResponse.ok) {
            const userData = await retryResponse.json();
            setUser(userData);
            setIsAuthenticated(true);
            setToken(newToken);
            return true;
          }
        }
      }

      // Auth failed
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication check failed";
      setError(errorMessage);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshAccessToken]);

  /**
   * Refresh user data from backend
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    const currentToken = token || getStoredToken();
    
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (currentToken) {
        headers["Authorization"] = `Bearer ${currentToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/accounts/me/`, {
        method: "GET",
        credentials: "include",
        headers,
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error("[Auth] Failed to refresh user:", err);
    }
  }, [token]);

  /**
   * Logout user
   * Clears both cookies and localStorage
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Call logout endpoint to clear server-side session
      await fetch(`${API_BASE_URL}/api/accounts/logout/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[Auth] Logout API call failed:", err);
    } finally {
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      
      // Clear localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
      
      // Redirect to landing page
      window.location.href = ENV.LANDING_PAGE_URL;
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    // Check if we have a token in localStorage
    const storedToken = getStoredToken();
    if (storedToken) {
      setToken(storedToken);
    }
    
    checkAuth();
  }, [checkAuth]);

  // Redirect to login if not authenticated (after initial check)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !user) {
      const currentUrl = window.location.href;
      if (!currentUrl.includes("/login")) {
        sessionStorage.setItem("propella_redirect_after_login", window.location.pathname);
        window.location.href = ENV.LOGIN_PAGE_URL;
      }
    }
  }, [isLoading, isAuthenticated, user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    token,
    checkAuth,
    logout,
    refreshUser,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
