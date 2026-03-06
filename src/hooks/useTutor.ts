import { useState, useCallback } from "react";
import { tutorApi } from "@/api/tutor.api";
import { useAppStore } from "@/state/app.store";
import type { ApiError, TutorChatPayload, TutorChatResponse } from "@/types/api.types";
import { toast } from "sonner";

interface UseTutorReturn {
  loading: boolean;
  error: ApiError | null;
  sendMessage: (message: string) => Promise<void>;
}

/**
 * Hook to manage AI tutor chat
 */
export function useTutor(): UseTutorReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const {
    tutorSessionId,
    addTutorMessage,
    setTutorSessionId,
    setIsLoadingTutor,
  } = useAppStore();

  const sendMessage = useCallback(
    async (message: string) => {
      setLoading(true);
      setIsLoadingTutor(true);
      setError(null);

      // Add user message immediately
      const userMessage = {
        id: `msg_${Date.now()}`,
        role: "user" as const,
        content: message,
        timestamp: new Date(),
        type: "text" as const,
      };
      addTutorMessage(userMessage);

      try {
        const payload: TutorChatPayload = {
          message,
          session_id: tutorSessionId || undefined,
        };

        const response: TutorChatResponse = await tutorApi.sendMessage(payload);

        // Update session ID if new
        if (!tutorSessionId && response.session_id) {
          setTutorSessionId(response.session_id);
        }

        // Add AI response
        const aiMessage = {
          id: `msg_${Date.now() + 1}`,
          role: "ai" as const,
          content: response.response,
          timestamp: new Date(),
          type: response.type,
        };
        addTutorMessage(aiMessage);
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : "Failed to get response",
          status: (err as { response?: { status: number } })?.response?.status || 500,
        };
        setError(apiError);
        toast.error("Failed to get response from AI tutor");

        // Add error message
        const errorMessage = {
          id: `msg_${Date.now() + 1}`,
          role: "ai" as const,
          content: "I'm sorry, I'm having trouble responding right now. Please try again.",
          timestamp: new Date(),
          type: "text" as const,
        };
        addTutorMessage(errorMessage);
      } finally {
        setLoading(false);
        setIsLoadingTutor(false);
      }
    },
    [tutorSessionId, addTutorMessage, setTutorSessionId, setIsLoadingTutor]
  );

  return {
    loading,
    error,
    sendMessage,
  };
}

/**
 * Hook to get tutor session history
 */
export function useTutorSession() {
  const { tutorSession, tutorSessionId, clearTutorSession } = useAppStore();

  return {
    messages: tutorSession,
    sessionId: tutorSessionId,
    clearSession: clearTutorSession,
    hasMessages: tutorSession.length > 0,
  };
}
