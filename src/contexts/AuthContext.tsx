/**
 * Auth Context - Syncs with UserStore for consistent auth state
 * 
 * This context wraps the Zustand user store to provide a consistent
 * auth interface across the app. It syncs with useUserStore state.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import { ENV } from "@/config/env";

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

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, user_id, nickname, username, clearUser } = useUserStore();
  const { isInitializing } = useAppStore();
  const [user, setUser] = useState<User | null>(null);

  // Sync local user state with Zustand store
  useEffect(() => {
    if (isAuthenticated && user_id) {
      setUser({
        id: user_id,
        email: username || `${user_id}@propella.ng`,
        username: username || user_id,
        nickname: nickname || username || user_id,
      });
    } else {
      setUser(null);
    }
  }, [isAuthenticated, user_id, nickname, username]);

  // Try to fetch user data from backend
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/accounts/me/`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        console.log("[Auth] Session expired");
      }
    } catch (err) {
      console.log("[Auth] Could not fetch user data:", err);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await fetch(`${ENV.API_BASE_URL}/accounts/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("[Auth] Logout failed:", err);
    } finally {
      clearUser();
      setUser(null);
      window.location.href = ENV.LANDING_PAGE_URL;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: isInitializing, // Use the app's initialization state
    isAuthenticated, // Use Zustand store state (not hardcoded!)
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
