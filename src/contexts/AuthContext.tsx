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
import { authApi } from "@/api/auth.api";

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

  // Try to fetch user data from backend and sync to store (uses authApi which wraps axios)
  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await authApi.getMe();
      // Map backend shape to local User type (id -> string)
      const mapped: User = {
        id: String((userData as any).id),
        email: (userData as any).email ?? "",
        username: (userData as any).username,
        nickname: (userData as any).nickname,
        first_name: (userData as any).first_name,
        last_name: (userData as any).last_name,
        referral_code: (userData as any).referral_code,
        referral_points: (userData as any).referral_points,
        total_referrals: (userData as any).total_referrals,
        is_verified: (userData as any).is_verified,
        date_joined: (userData as any).date_joined,
        phone_number: (userData as any).phone_number,
        avatar: (userData as any).avatar,
      };
      setUser(mapped);

      const updates: Parameters<typeof setStoreUser>[0] = {};
      if ((userData as any)?.id != null) updates.user_id = String((userData as any).id);
      if ((userData as any)?.email != null) updates.email = (userData as any).email;
      if ((userData as any)?.username != null) updates.username = (userData as any).username;
      if ((userData as any)?.nickname != null) updates.nickname = (userData as any).nickname;
      if (Object.keys(updates).length > 0) setStoreUser(updates);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("[Auth] Session expired");
      } else {
        console.log("[Auth] Could not fetch user data:", err);
      }
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
