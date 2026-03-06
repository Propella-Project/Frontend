import { useState, useCallback, useEffect } from "react";
import { streakApi } from "@/api/streak.api";
import { useUserStore } from "@/state/user.store";
import type { ApiError, StreakResponse } from "@/types/api.types";
import { toast } from "sonner";

interface UseStreakReturn {
  streak: number;
  longestStreak: number;
  loading: boolean;
  error: ApiError | null;
  updateStreak: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage user streak
 */
export function useStreak(): UseStreakReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);

  const { streak, setUser } = useUserStore();

  const fetchStreak = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await streakApi.getStreak();
      setStreakData(data);
      
      // Update user store
      setUser({
        streak: data.current_streak,
      });
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : "Failed to load streak",
        status: (err as { response?: { status: number } })?.response?.status || 500,
      };
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const updateStreak = useCallback(async (): Promise<boolean> => {
    try {
      const data = await streakApi.updateStreak();
      setStreakData(data);
      
      // Update user store
      setUser({
        streak: data.current_streak,
      });

      if (data.streak_multiplier > 1) {
        toast.success(`Streak updated! 🔥 ${data.current_streak} days!`);
      }

      return true;
    } catch (err) {
      toast.error("Failed to update streak");
      return false;
    }
  }, [setUser]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streak: streakData?.current_streak || streak,
    longestStreak: streakData?.longest_streak || streak,
    loading,
    error,
    updateStreak,
    refetch: fetchStreak,
  };
}
