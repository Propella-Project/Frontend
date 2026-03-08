import { type ReactNode, useEffect, useState, useCallback, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import { dashboardApi } from "@/api/dashboard.api";
import { captureReferralData } from "@/utils/referral";
import { useDailyRoadmapNotification } from "@/state/notification.store";
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
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">
          {error.message || "An unexpected error occurred"}
        </p>
        <Button onClick={resetError} variant="default">
          Try Again
        </Button>
      </div>
    </div>
  );
}

/**
 * NotificationInitializer - Handles daily roadmap notifications
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

  return <>{children}</>;
}

/**
 * AppInitializer - Handles initial app data loading with error handling
 */
function AppInitializer({ children }: { children: ReactNode }) {
  const { setUser, setAuthenticated, updateProfile, clearUser } = useUserStore();
  const { setIsInitializing } = useAppStore();
  const [initError, setInitError] = useState<Error | null>(null);

  const initializeApp = useCallback(async () => {
    try {
      // Capture referral data from URL on app load
      captureReferralData();
      
      // Load and sync persisted AI Tutor
      const savedTutor = loadPersistedTutor();
      if (savedTutor) {
        updateProfile({ ai_tutor_selected: savedTutor });
      }
      
      const token = localStorage.getItem("propella_token");
      
      if (!token) {
        setAuthenticated(false);
        setIsInitializing(false);
        return;
      }

      setAuthenticated(true);

      try {
        // Fetch dashboard data to initialize user state
        const dashboardData = await dashboardApi.getDashboard();
        
        setUser({
          nickname: dashboardData.nickname,
          rank: dashboardData.rank,
          level: dashboardData.level,
          points: dashboardData.points,
          streak: dashboardData.streak,
        });
      } catch (error) {
        console.error("[AppInitializer] Dashboard fetch failed:", error);
        // Don't fail initialization if dashboard fails - we'll use fallback data
      }
    } catch (error) {
      console.error("[AppInitializer] Initialization failed:", error);
      setInitError(error instanceof Error ? error : new Error("Initialization failed"));
    } finally {
      setIsInitializing(false);
    }
  }, [setUser, setAuthenticated, setIsInitializing, updateProfile]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

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
            <Suspense fallback={<LoadingScreen />}>
              {children}
            </Suspense>
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
