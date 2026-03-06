import { useState, useCallback, useEffect } from "react";
import { learningApi } from "@/api/learning.api";
import { useAppStore } from "@/state/app.store";
import type { ApiError, WeakTopic, Assignment } from "@/types/api.types";
import { toast } from "sonner";

interface UseLearningReturn {
  weakTopics: WeakTopic[];
  assignments: Assignment[];
  loading: boolean;
  error: ApiError | null;
  refetchWeakTopics: () => Promise<void>;
  refetchAssignments: () => Promise<void>;
  completeAssignment: (assignmentId: string) => Promise<boolean>;
}

/**
 * Hook to manage weak topics and assignments
 */
export function useLearning(): UseLearningReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const {
    weakTopics,
    assignments,
    setWeakTopics,
    setAssignments,
    completeAssignment: completeAssignmentInStore,
  } = useAppStore();

  const fetchWeakTopics = useCallback(async () => {
    // Return cached data if available
    if (weakTopics.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await learningApi.getWeakTopics();
      setWeakTopics(data);
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : "Failed to load weak topics",
        status: (err as { response?: { status: number } })?.response?.status || 500,
      };
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [weakTopics.length, setWeakTopics]);

  const fetchAssignments = useCallback(async () => {
    // Return cached data if available
    if (assignments.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await learningApi.getAssignments();
      setAssignments(data);
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : "Failed to load assignments",
        status: (err as { response?: { status: number } })?.response?.status || 500,
      };
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [assignments.length, setAssignments]);

  const completeAssignment = useCallback(
    async (assignmentId: string): Promise<boolean> => {
      try {
        await learningApi.completeAssignment(assignmentId);
        completeAssignmentInStore(assignmentId);
        toast.success("Assignment completed!");
        return true;
      } catch (err) {
        toast.error("Failed to complete assignment");
        return false;
      }
    },
    [completeAssignmentInStore]
  );

  useEffect(() => {
    fetchWeakTopics();
    fetchAssignments();
  }, [fetchWeakTopics, fetchAssignments]);

  return {
    weakTopics,
    assignments,
    loading,
    error,
    refetchWeakTopics: fetchWeakTopics,
    refetchAssignments: fetchAssignments,
    completeAssignment,
  };
}

/**
 * Hook to get pending assignments count
 */
export function usePendingAssignmentsCount() {
  const { assignments } = useAppStore();
  
  const pendingCount = assignments.filter(
    (a) => a.status === "pending" || a.status === "in_progress"
  ).length;

  return pendingCount;
}
