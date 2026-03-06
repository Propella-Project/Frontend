import { type ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import { dashboardApi } from "@/api/dashboard.api";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * AppInitializer - Handles initial app data loading
 */
function AppInitializer({ children }: { children: ReactNode }) {
  const { setUser, setAuthenticated } = useUserStore();
  const { setIsInitializing } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
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
        console.error("Failed to initialize app:", error);
        // Don't show error toast on initial load to avoid bad UX
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [setUser, setAuthenticated, setIsInitializing]);

  return <>{children}</>;
}

/**
 * Main Providers component
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AppInitializer>
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
    </AppInitializer>
  );
}
