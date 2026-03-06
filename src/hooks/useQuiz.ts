import { useState, useCallback } from "react";
import { quizApi } from "@/api/quiz.api";
import { useAppStore } from "@/state/app.store";
import type { DiagnosticQuestion, QuizResultItem, ApiError } from "@/types/api.types";
import { toast } from "sonner";

interface UseQuizReturn {
  loading: boolean;
  error: ApiError | null;
  fetchDiagnosticQuiz: (subject: string) => Promise<DiagnosticQuestion[]>;
  submitResults: (results: QuizResultItem[]) => Promise<boolean>;
}

/**
 * Hook to manage quiz operations
 */
export function useQuiz(): UseQuizReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const { setDiagnosticQuiz } = useAppStore();

  const fetchDiagnosticQuiz = useCallback(
    async (subject: string): Promise<DiagnosticQuestion[]> => {
      setLoading(true);
      setError(null);

      try {
        const questions = await quizApi.getDiagnosticQuiz(subject);
        
        // Store in app state
        setDiagnosticQuiz({
          questions: questions.map((q) => ({
            ...q,
            subjectId: subject,
            topicId: "general",
          })),
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

  const submitResults = useCallback(
    async (results: QuizResultItem[]): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await quizApi.submitResults({ results });
        toast.success("Quiz results submitted successfully!");
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
    fetchDiagnosticQuiz,
    submitResults,
  };
}
