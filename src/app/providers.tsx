import { type ReactNode, useEffect, useState, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import { useStore } from "@/store";

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
      
      // Check Zustand store state (which is rehydrated from localStorage)
      // If store says authenticated, trust it and keep session
      // If store says not authenticated, clear tokens to prevent issues
      if (storeState.isAuthenticated && storeState.user_id) {
        console.log("[AppInitializer] Store has authenticated session, keeping it");
        // Refresh user data in background if we have a token
        if (token) {
          const { refreshUserData, fetchReferralStats } = useUserStore.getState();
          refreshUserData().catch(() => {/* silent fail */});
          fetchReferralStats().catch(() => {/* silent fail */});
        }
      } else {
        // Store says not authenticated - clear any leftover tokens
        // This prevents conflicts between localStorage tokens and Zustand state
        console.log("[AppInitializer] Store shows not authenticated - clearing tokens");
        if (storeState.isAuthenticated || storeState.user_id) {
          clearUser();
        }
        setAuthenticated(false);
        
        // Clear conflicting tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("propella_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("propella_user_id");
      }
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
          </NotificationInitializer>
        </AppInitializer>
      </MswProvider>
    </ErrorBoundary>
  );
}
