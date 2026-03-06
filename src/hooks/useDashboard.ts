import { useState, useCallback, useEffect } from "react";
import { dashboardApi } from "@/api/dashboard.api";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import type { DashboardResponse, ApiError } from "@/types/api.types";
import { toast } from "sonner";

interface UseDashboardReturn {
  data: DashboardResponse | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage dashboard data
 * Updates global user state with dashboard information
 */
export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const { setUser } = useUserStore();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dashboardData = await dashboardApi.getDashboard();
      setData(dashboardData);

      // Update global user state
      setUser({
        nickname: dashboardData.nickname,
        rank: dashboardData.rank,
        level: dashboardData.level,
        points: dashboardData.points,
        streak: dashboardData.streak,
      });
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : "Failed to load dashboard",
        status: (err as { response?: { status: number } })?.response?.status || 500,
      };
      setError(apiError);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
  };
}

/**
 * Hook to fetch performance graph data
 */
export function usePerformanceGraph() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { performanceGraph, setPerformanceGraph } = useAppStore();

  const fetchPerformanceGraph = useCallback(async () => {
    // Return cached data if available
    if (performanceGraph && performanceGraph.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await dashboardApi.getPerformanceGraph();
      setPerformanceGraph(data);
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : "Failed to load performance data",
        status: (err as { response?: { status: number } })?.response?.status || 500,
      };
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [performanceGraph, setPerformanceGraph]);

  return {
    data: performanceGraph,
    loading,
    error,
    refetch: fetchPerformanceGraph,
  };
}
