import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { TutorChatPayload, TutorChatResponse } from "@/types/api.types";

export const tutorApi = {
  // Send message to AI tutor
  sendMessage: async (payload: TutorChatPayload): Promise<TutorChatResponse> => {
    const response = await apiClient.post(ENDPOINTS.tutor.chat, payload);
    return response.data;
  },

  // Stream message (for real-time responses if supported)
  streamMessage: async (
    payload: TutorChatPayload,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const response = await fetch(ENDPOINTS.tutor.chat, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("propella_token")}`,
      },
      body: JSON.stringify(payload),
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
};
