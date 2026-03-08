/**
 * Auth Context - Simple Cookie-Based Authentication
 * 
 * Just uses cookies set by landing page. No blocking auth checks.
 * Shows notification if API calls fail due to auth.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ENV } from "@/config/env";
import { toast } from "sonner";

// User type
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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const API_BASE_URL = ENV.API_BASE_URL.replace(/\/api$/, '');

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to fetch user data, but don't block if it fails
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/me/`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);

      } else if (response.status === 401) {
        // Not authenticated - show toast but don't block
        toast.error("Session expired. Some features may not work.");
        setUser({ id: "guest", email: "guest@propella.ng" });
      }
    } catch (err) {
      // API error - silently fail, user can still use dashboard
      console.log("[Auth] Could not fetch user data:", err);
    }
  }, []);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/api/accounts/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("[Auth] Logout failed:", err);
    } finally {
      setUser(null);
      window.location.href = ENV.LANDING_PAGE_URL;
    }
  }, []);

  // Fetch user on mount (non-blocking)
  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: true, // Always allow access
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
