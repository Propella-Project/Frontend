import { useState, useCallback } from "react";
import { onboardingApi } from "@/api/onboarding.api";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import type {
  ExamProfilePayload,
  UserSubjectsPayload,
  DiagnosticQuestion,
  QuizResultItem,
  ApiError,
} from "@/types/api.types";
import { toast } from "sonner";

interface UseOnboardingReturn {
  loading: boolean;
  error: ApiError | null;
  saveExamProfile: (payload: ExamProfilePayload) => Promise<boolean>;
  saveSubjects: (payload: UserSubjectsPayload) => Promise<boolean>;
  fetchDiagnosticQuiz: (subject: string) => Promise<DiagnosticQuestion[]>;
  submitDiagnosticResults: (results: QuizResultItem[]) => Promise<boolean>;
}

/**
 * Hook to manage onboarding flow API calls
 */
export function useOnboarding(): UseOnboardingReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const { setUser } = useUserStore();
  const { setDiagnosticQuiz } = useAppStore();

  const saveExamProfile = useCallback(
    async (payload: ExamProfilePayload): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await onboardingApi.saveExamProfile(payload);
        
        // Update user store
        setUser({
          nickname: payload.nickname,
          exam_date: payload.exam_date,
          study_hours_per_day: payload.study_hours_per_day,
          ai_tutor_selected: payload.ai_tutor_selected,
          ai_voice_enabled: payload.ai_voice_enabled,
        });

        return true;
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : "Failed to save profile",
          status: (err as { response?: { status: number } })?.response?.status || 500,
        };
        setError(apiError);
        toast.error("Failed to save profile. Please try again.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setUser]
  );

  const saveSubjects = useCallback(
    async (payload: UserSubjectsPayload): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await onboardingApi.saveUserSubjects(payload);
        
        // Update user store
        setUser({
          subjects: payload.subjects,
        });

        return true;
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : "Failed to save subjects",
          status: (err as { response?: { status: number } })?.response?.status || 500,
        };
        setError(apiError);
        toast.error("Failed to save subjects. Please try again.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setUser]
  );

  const fetchDiagnosticQuiz = useCallback(
    async (subject: string): Promise<DiagnosticQuestion[]> => {
      setLoading(true);
      setError(null);

      try {
        const questions = await onboardingApi.getDiagnosticQuiz(subject);
        
        // Store in app state
        setDiagnosticQuiz({
          questions,
          currentSubjectIndex: 0,
          answers: [],
        });

        return questions;
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : "Failed to load quiz",
          status: (err as { response?: { status: number } })?.response?.status || 500,
        };
        setError(apiError);
        toast.error("Failed to load diagnostic quiz");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [setDiagnosticQuiz]
  );

  const submitDiagnosticResults = useCallback(
    async (results: QuizResultItem[]): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await onboardingApi.submitQuizResults({ results });
        toast.success("Diagnostic completed! Your roadmap is being generated...");
        return true;
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : "Failed to submit results",
          status: (err as { response?: { status: number } })?.response?.status || 500,
        };
        setError(apiError);
        toast.error("Failed to submit quiz results");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    saveExamProfile,
    saveSubjects,
    fetchDiagnosticQuiz,
    submitDiagnosticResults,
  };
}
