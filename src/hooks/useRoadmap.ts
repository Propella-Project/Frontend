import { useState, useCallback, useEffect } from "react";
import { roadmapApi } from "@/api/roadmap.api";
import { useAppStore } from "@/state/app.store";
import type { ApiError, TodayRoadmapResponse } from "@/types/api.types";
import { toast } from "sonner";

interface UseRoadmapReturn {
  todayRoadmap: TodayRoadmapResponse | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  completeTask: (taskId: string) => Promise<boolean>;
}

/**
 * Hook to fetch and manage today's roadmap
 */
export function useRoadmap(): UseRoadmapReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const { 
    todayRoadmap, 
    setTodayRoadmap, 
    setRoadmapGenerationStatus,
    setIsLoadingRoadmap,
  } = useAppStore();

  const fetchTodayRoadmap = useCallback(async () => {
    setLoading(true);
    setIsLoadingRoadmap(true);
    setError(null);

    try {
      const data = await roadmapApi.getTodayRoadmap();
      setTodayRoadmap(data);
      setRoadmapGenerationStatus(data.generation_status);
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : "Failed to load roadmap",
        status: (err as { response?: { status: number } })?.response?.status || 500,
      };
      setError(apiError);
      setRoadmapGenerationStatus("error");
    } finally {
      setLoading(false);
      setIsLoadingRoadmap(false);
    }
  }, [setTodayRoadmap, setRoadmapGenerationStatus, setIsLoadingRoadmap]);

  const completeTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        await roadmapApi.completeTask(taskId);
        
        // Update local state
        const updatedTasks = todayRoadmap?.tasks.map((task) =>
          task.id === taskId ? { ...task, status: "completed" as const } : task
        );
        
        if (todayRoadmap && updatedTasks) {
          setTodayRoadmap({
            ...todayRoadmap,
            tasks: updatedTasks,
            progress: Math.round(
              (updatedTasks.filter((t) => t.status === "completed").length /
                updatedTasks.length) *
                100
            ),
          });
        }

        toast.success("Task completed!");
        return true;
      } catch (err) {
        toast.error("Failed to complete task");
        return false;
      }
    },
    [todayRoadmap, setTodayRoadmap]
  );

  useEffect(() => {
    // Only fetch if we don't have today's roadmap
    if (!todayRoadmap) {
      fetchTodayRoadmap();
    }
  }, [fetchTodayRoadmap, todayRoadmap]);

  return {
    todayRoadmap,
    loading,
    error,
    refetch: fetchTodayRoadmap,
    completeTask,
  };
}

/**
 * Hook to fetch full roadmap
 */
export function useFullRoadmap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { roadmap, setRoadmap } = useAppStore();

  // Note: Full roadmap fetching would require a dedicated endpoint
  // This is a placeholder for when that endpoint is available
  const fetchFullRoadmap = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Implementation when endpoint is available
      // const data = await roadmapApi.getFullRoadmap();
      // setRoadmap(data);
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : "Failed to load roadmap",
        status: (err as { response?: { status: number } })?.response?.status || 500,
      };
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [setRoadmap]);

  return {
    roadmap,
    loading,
    error,
    refetch: fetchFullRoadmap,
  };
}
