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
  const { isAuthenticated, user_id, nickname, username, email: storeEmail, setUser: setStoreUser, clearUser } = useUserStore();
  const { isInitializing } = useAppStore();
  const [user, setUser] = useState<User | null>(null);

  // Sync local user state with Zustand store (include email from store for subscription flow)
  useEffect(() => {
    if (isAuthenticated && user_id) {
      setUser({
        id: user_id,
        email: storeEmail ?? username ?? `${user_id}@propella.ng`,
        username: username || user_id,
        nickname: nickname || username || user_id,
      });
    } else {
      setUser(null);
    }
  }, [isAuthenticated, user_id, nickname, username, storeEmail]);

  // Sync user from storage to store (no /accounts/me – server endpoint not used; 24h expiry in storage)
  const refreshUser = async (): Promise<void> => {
    try {
      const { authApi } = await import("@/api/auth.api");
      const stored = authApi.getStoredUser();
      if (stored) {
        setUser({
          id: String(stored.id),
          email: stored.email,
          username: stored.username,
          nickname: stored.nickname ?? stored.username ?? "",
        });
        const updates: Parameters<typeof setStoreUser>[0] = {
          user_id: String(stored.id),
          email: stored.email,
          username: stored.username,
          nickname: stored.nickname ?? stored.username ?? "",
        };
        setStoreUser(updates);
      }
    } catch (err) {
    }
  };

  // Logout – clear store and auth storage (tokens + user; 24h data removed)
  const logout = async (): Promise<void> => {
    try {
      const { authApi } = await import("@/api/auth.api");
      await authApi.logout();
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

const defaultAuthValue: AuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  logout: async () => {},
  refreshUser: async () => {},
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context === undefined ? defaultAuthValue : context;
}

export default AuthContext;
