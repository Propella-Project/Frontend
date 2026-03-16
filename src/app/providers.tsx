import { type ReactNode, useEffect, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import { useStore } from "@/store";
import { AuthProvider } from "@/contexts/AuthContext";

import { captureReferralData } from "@/utils/referral";
import { useDailyRoadmapNotification } from "@/state/notification.store";
// import { useNotifications } from "@/hooks/useSettings";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { initMocks } from "@/mocks";

// Lazy load MSW in development only
const initMswInDev = async () => {
  if (import.meta.env.DEV) {
    await initMocks();
  }
};

// Load AI Tutor from localStorage and sync with user store
const loadPersistedTutor = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aiTutor");
};

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Loading Screen Component
 */
function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Error Fallback Component
 */
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  // Handle case where error.message might be an object
  const errorMessage = typeof error.message === 'object' 
    ? JSON.stringify(error.message) 
    : (error.message || "An unexpected error occurred");
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">
          {errorMessage}
        </p>
        <Button onClick={resetError} variant="default">
          Try Again
        </Button>
      </div>
    </div>
  );
}

/**
 * BackendNotificationFetcher - Fetches notifications from backend
 * DISABLED: Notification endpoint not available
 */
function BackendNotificationFetcher() {
  // const { isAuthenticated } = useUserStore();
  // const { refetch } = useNotifications();

  // useEffect(() => {
  //   // Only fetch notifications when user is authenticated
  //   if (isAuthenticated) {
  //     refetch();
  //   }
  // }, [isAuthenticated, refetch]);

  return null;
}

/**
 * NotificationInitializer - Handles daily roadmap notifications and backend notifications
 */
function NotificationInitializer({ children }: { children: ReactNode }) {
  const { checkAndAddDailyNotification, cleanupExpired } = useDailyRoadmapNotification();

  useEffect(() => {
    // Clean up expired notifications on mount (only once)
    cleanupExpired();
    
    // Check for daily notification immediately
    checkAndAddDailyNotification();
    
    // Set up interval to check every minute
    const interval = setInterval(() => {
      checkAndAddDailyNotification();
    }, 60000);
    
    // Clean up expired notifications every hour
    const cleanupInterval = setInterval(() => {
      cleanupExpired();
    }, 3600000);

    return () => {
      clearInterval(interval);
      clearInterval(cleanupInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  return (
    <>
      <BackendNotificationFetcher />
      {children}
    </>
  );
}

/**
 * AppInitializer - Handles initial app data loading with error handling
 */
function AppInitializer({ children }: { children: ReactNode }) {
  const { setUser, setAuthenticated, updateProfile, clearUser } = useUserStore();
  const { setIsInitializing } = useAppStore();
  const [initError, setInitError] = useState<Error | null>(null);
  const [hasRehydrated, setHasRehydrated] = useState(false);

  // Wait for BOTH stores (user store and main store) to rehydrate before doing anything
  useEffect(() => {
    let userStoreHydrated = false;
    let mainStoreHydrated = false;
    
    const checkBothHydrated = () => {
      if (userStoreHydrated && mainStoreHydrated) {
        console.log("[AppInitializer] Both stores rehydrated");
        setHasRehydrated(true);
      }
    };
    
    // Check user store
    const checkUserStore = () => {
      const persist = useUserStore.persist as unknown as { hasHydrated?: () => boolean };
      if (persist.hasHydrated?.()) {
        console.log("[AppInitializer] User store already hydrated");
        userStoreHydrated = true;
        checkBothHydrated();
        return true;
      }
      return false;
    };
    
    // Check main store
    const checkMainStore = () => {
      const persist = useStore.persist as unknown as { hasHydrated?: () => boolean };
      if (persist.hasHydrated?.()) {
        console.log("[AppInitializer] Main store already hydrated");
        mainStoreHydrated = true;
        checkBothHydrated();
        return true;
      }
      return false;
    };
    
    // Initial checks
    const userStoreReady = checkUserStore();
    const mainStoreReady = checkMainStore();
    
    // Subscribe to hydration events if not already hydrated
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeMain: (() => void) | undefined;
    
    if (!userStoreReady) {
      unsubscribeUser = useUserStore.persist.onFinishHydration(() => {
        console.log("[AppInitializer] User store rehydrated");
        userStoreHydrated = true;
        checkBothHydrated();
      });
    }
    
    if (!mainStoreReady) {
      unsubscribeMain = useStore.persist.onFinishHydration(() => {
        console.log("[AppInitializer] Main store rehydrated");
        mainStoreHydrated = true;
        checkBothHydrated();
      });
    }
    
    // Fallback timeout in case hydration events don't fire
    const timeout = setTimeout(() => {
      console.log("[AppInitializer] Hydration timeout - forcing continue");
      setHasRehydrated(true);
    }, 2000);
    
    return () => {
      unsubscribeUser?.();
      unsubscribeMain?.();
      clearTimeout(timeout);
    };
  }, []);

  const initializeApp = useCallback(async () => {
    // Don't initialize until store is rehydrated
    if (!hasRehydrated) return;
    
    try {
      // Capture referral data from URL on app load
      captureReferralData();
      
      // Load and sync persisted AI Tutor
      const savedTutor = loadPersistedTutor();
      if (savedTutor) {
        updateProfile({ ai_tutor_selected: savedTutor });
      }
      
      // Check if user has valid tokens
      const token = localStorage.getItem("access_token") || localStorage.getItem("auth_token") || localStorage.getItem("propella_token");
      const userId = localStorage.getItem("propella_user_id");
      
      // Get current store state (which should have rehydrated)
      const storeState = useUserStore.getState();
      
      console.log("[AppInitializer] Checking session:", { 
        hasToken: !!token, 
        hasUserId: !!userId, 
        storeAuth: storeState.isAuthenticated,
        storeUserId: storeState.user_id 
      });
      
      // If store has authenticated session, keep it and optionally refresh user
      if (storeState.isAuthenticated && storeState.user_id) {
        console.log("[AppInitializer] Store has authenticated session, keeping it");
        if (token) {
          const { refreshUserData, fetchReferralStats } = useUserStore.getState();
          refreshUserData().catch(() => {/* silent fail */});
          fetchReferralStats().catch(() => {/* silent fail */});
        }
        return;
      }

      // If we have tokens but store is not authenticated, try to restore session (e.g. persist was cleared)
      if (token) {
        let shouldClearTokens = true;
        try {
          const { authApi } = await import("@/api/auth.api");
          const me = await authApi.getMe();
          const userData = {
            user_id: String((me as any).id),
            email: (me as any).email,
            username: (me as any).username,
            nickname: (me as any).nickname ?? (me as any).username ?? "",
          };
          setUser(userData);
          setAuthenticated(true);
          localStorage.setItem("propella_user_id", String((me as any).id));
          if ((me as any).email) localStorage.setItem("propella_user_email", (me as any).email);
          if ((me as any).nickname) localStorage.setItem("propella_user_nickname", (me as any).nickname);
          console.log("[AppInitializer] Session restored from token");
          return;
        } catch (err: any) {
          // Don't immediately clear tokens on 404 (endpoint missing) or other non-auth errors.
          const status = err?.response?.status;
          if (status === 401) {
            // Token invalid or expired - proceed to clear below
            console.log('[AppInitializer] Token invalid or expired (401)');
            shouldClearTokens = true;
          } else if (status === 404) {
            console.warn('[AppInitializer] /accounts/me returned 404 - backend may not expose this endpoint. Falling back to persisted user.');
            shouldClearTokens = false;
            const storedUserId = localStorage.getItem('propella_user_id');
            const storedEmail = localStorage.getItem('propella_user_email');
            const storedNickname = localStorage.getItem('propella_user_nickname');
            if (storedUserId) {
              setUser({ user_id: storedUserId, email: storedEmail ?? undefined, nickname: storedNickname ?? (storedEmail ? storedEmail.split('@')[0] : '') });
              setAuthenticated(true);
              return;
            }
            // No persisted user to fall back to - keep tokens but don't clear them
            return;
          } else {
            console.warn('[AppInitializer] getMe failed with non-auth error, preserving tokens where possible:', err);
            shouldClearTokens = false;
            const storedUserId = localStorage.getItem('propella_user_id');
            const storedEmail = localStorage.getItem('propella_user_email');
            const storedNickname = localStorage.getItem('propella_user_nickname');
            if (storedUserId) {
              setUser({ user_id: storedUserId, email: storedEmail ?? undefined, nickname: storedNickname ?? (storedEmail ? storedEmail.split('@')[0] : '') });
              setAuthenticated(true);
              return;
            }
          }

          if (shouldClearTokens) {
            // allow fallthrough to clearing tokens below
          } else {
            // don't clear tokens; continue without altering auth state
            return;
          }
        }
      }

      // No valid session: clear tokens and ensure store is logged out
      console.log("[AppInitializer] No authenticated session - clearing tokens");
      if (storeState.isAuthenticated || storeState.user_id) {
        clearUser();
      }
      setAuthenticated(false);
      localStorage.removeItem("access_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("propella_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("propella_user_id");
      localStorage.removeItem("propella_user_email");
      localStorage.removeItem("propella_user_nickname");
    } catch (error) {
      console.error("[AppInitializer] Initialization failed:", error);
      setInitError(error instanceof Error ? error : new Error("Initialization failed"));
    } finally {
      setIsInitializing(false);
    }
  }, [setUser, setAuthenticated, setIsInitializing, updateProfile, clearUser, hasRehydrated]);

  useEffect(() => {
    if (hasRehydrated) {
      initializeApp();
    }
  }, [initializeApp, hasRehydrated]);

  // Listen for auth failures
  useEffect(() => {
    const handleAuthFailure = () => {
      clearUser();
      setIsInitializing(false);
    };

    window.addEventListener("propella:auth:failure", handleAuthFailure);
    return () => {
      window.removeEventListener("propella:auth:failure", handleAuthFailure);
    };
  }, [clearUser, setIsInitializing]);

  if (initError) {
    return (
      <ErrorFallback 
        error={initError} 
        resetError={() => {
          setInitError(null);
          initializeApp();
        }} 
      />
    );
  }

  return <>{children}</>;
}

/**
 * MswProvider - Initializes Mock Service Worker
 */
function MswProvider({ children }: { children: ReactNode }) {
  const [isMswReady, setIsMswReady] = useState(!import.meta.env.DEV);

  useEffect(() => {
    if (import.meta.env.DEV) {
      initMswInDev().then(() => {
        setIsMswReady(true);
      }).catch((error) => {
        console.warn("[MSW] Failed to initialize:", error);
        setIsMswReady(true); // Continue anyway
      });
    }
  }, []);

  if (!isMswReady) {
    return <LoadingScreen message="Initializing development environment..." />;
  }

  return <>{children}</>;
}

/**
 * Main Providers component with Error Boundary
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("[ErrorBoundary] Global error:", error, errorInfo);
      }}
    >
      <MswProvider>
        <AppInitializer>
          <NotificationInitializer>
            <AuthProvider>
              {children}
              <Toaster 
                position="top-center"
                toastOptions={{
                  style: {
                    background: "#1A1A1E",
                    border: "1px solid #2A2A2E",
                    color: "#F3F4F6",
                  },
                }}
              />
            </AuthProvider>
          </NotificationInitializer>
        </AppInitializer>
      </MswProvider>
    </ErrorBoundary>
  );
}
