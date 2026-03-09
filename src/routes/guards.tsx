import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useStore } from "@/store";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import { Loader2 } from "lucide-react";

/**
 * Auth Guard - Redirects authenticated users away from auth pages
 * Used for: /, /login, /forgot-password, /reset-password
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUserStore();
  const { isOnboardingComplete } = useStore();
  const { isInitializing } = useAppStore();

  // Wait for initialization before making redirect decisions
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0C15]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (!isOnboardingComplete) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * Require Auth Guard - Ensures user is authenticated
 * Used for: /onboarding, /dashboard
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUserStore();
  const { isInitializing } = useAppStore();

  // Wait for initialization before making redirect decisions
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F11]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Require Onboarding Guard - Ensures user has completed onboarding
 * Used for: /dashboard
 */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUserStore();
  const { isOnboardingComplete } = useStore();
  const { isInitializing } = useAppStore();

  // Wait for initialization before making redirect decisions
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F11]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isOnboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

/**
 * Prevent Completed Onboarding Guard - Prevents access to onboarding if already done
 * Used for: /onboarding
 */
export function PreventCompletedOnboarding({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUserStore();
  const { isOnboardingComplete } = useStore();
  const { isInitializing } = useAppStore();

  // Wait for initialization before making redirect decisions
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F11]">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isOnboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
