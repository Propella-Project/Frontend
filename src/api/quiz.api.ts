import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { 
  DiagnosticQuestion, 
  QuizResultsPayload,
} from "@/types/api.types";

export const quizApi = {
  // Get diagnostic quiz for a subject
  getDiagnosticQuiz: async (subject: string): Promise<DiagnosticQuestion[]> => {
    const response = await apiClient.get(ENDPOINTS.diagnostic.getQuiz(subject));
    return response.data;
  },

  // Submit quiz results
  submitResults: async (payload: QuizResultsPayload): Promise<void> => {
    const response = await apiClient.post(ENDPOINTS.diagnostic.submitResults, payload);
    return response.data;
  },
};
