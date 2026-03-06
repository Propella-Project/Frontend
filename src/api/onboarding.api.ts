import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type {
  ExamProfilePayload,
  UserSubjectsPayload,
  DiagnosticQuestion,
  QuizResultsPayload,
} from "@/types/api.types";

export const onboardingApi = {
  // Save exam profile (nickname, exam_date, study_hours, ai_tutor, ai_voice)
  saveExamProfile: async (payload: ExamProfilePayload): Promise<void> => {
    const response = await apiClient.post(ENDPOINTS.onboarding.examProfile, payload);
    return response.data;
  },

  // Save user subjects (must be exactly 4 subjects)
  saveUserSubjects: async (payload: UserSubjectsPayload): Promise<void> => {
    const response = await apiClient.post(ENDPOINTS.onboarding.userSubjects, payload);
    return response.data;
  },

  // Get diagnostic quiz for a subject
  getDiagnosticQuiz: async (subject: string): Promise<DiagnosticQuestion[]> => {
    const response = await apiClient.get(ENDPOINTS.diagnostic.getQuiz(subject));
    return response.data;
  },

  // Submit diagnostic quiz results
  submitQuizResults: async (payload: QuizResultsPayload): Promise<void> => {
    const response = await apiClient.post(ENDPOINTS.diagnostic.submitResults, payload);
    return response.data;
  },
};
