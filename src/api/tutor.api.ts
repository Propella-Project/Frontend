import aiEngineApi from "./ai-engine.api";
import { ENV } from "@/config/env";
import type { TutorChatPayload, TutorChatResponse } from "@/types/api.types";

export const tutorApi = {
  // Send message to AI tutor - POWERED BY AI ENGINE
  sendMessage: async (payload: TutorChatPayload): Promise<TutorChatResponse> => {
    const aiResponse = await aiEngineApi.sendMessage({
      message: payload.message,
      chat_id: payload.session_id || null,
      use_rag: false,
    });

    return {
      response: aiResponse.reply,
      session_id: aiResponse.chat_id,
      type: "text",
    };
  },

  // Stream message (for real-time responses if supported)
  streamMessage: async (
    payload: TutorChatPayload,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    
    const response = await fetch(`${ENV.AI_ENGINE_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ENV.AI_ENGINE_API_KEY,
      },
      body: JSON.stringify({
        message: payload.message,
        chat_id: payload.session_id || null,
        use_rag: false,
      }),
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value));
    }
  },
  
  // Explain topic using AI Engine
  explainTopic: async (
    subject: string,
    topic: string,
    subtopic?: string,
    studentLevel: "beginner" | "intermediate" | "advanced" = "intermediate"
  ): Promise<{ explanation: string; worked_example: string; practice_question: string }> => {
    const response = await aiEngineApi.explainTopic({
      subject,
      topic,
      subtopic,
      student_level: studentLevel,
    });
    return response;
  },
};

export default tutorApi;
