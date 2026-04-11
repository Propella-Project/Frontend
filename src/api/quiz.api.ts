import apiClient from "./client";
import aiEngineApi from "./ai-engine.api";
import { ENDPOINTS } from "@/config/endpoints";
import { useUserStore } from "@/state/user.store";
import type { 
  DiagnosticQuestion, 
  QuizResultsPayload,
} from "@/types/api.types";

// Default quiz configuration (matches backend schema)
const DEFAULT_QUIZ_CONFIG = {
  number_of_questions: 10,
  difficulty: "medium" as const,
  topic: "any" as const,
};

// Backend quiz payload: { subjects: string[], topic, difficulty, number_of_questions }
// Response: { questions: [{ subject, question, options, correct_answer, explanation, allocated_time }] }
export interface GenerateQuizPayload {
  subjects: string[];
  topic?: string;
  difficulty?: string;
  number_of_questions?: number;
}

function normalizeSubjects(subjects: string[]): string[] {
  return subjects.map((s) => (typeof s === "string" ? s.trim().toLowerCase() : String(s)));
}

export const quizApi = {
  // Generate quiz from backend: POST with user's selected subjects (e.g. from onboarding) + topic, difficulty, number_of_questions
  generateDiagnosticQuiz: async (
    payload: GenerateQuizPayload
  ): Promise<DiagnosticQuestion[]> => {
    const body = {
      subjects: normalizeSubjects(payload.subjects),
      topic: payload.topic ?? DEFAULT_QUIZ_CONFIG.topic,
      difficulty: payload.difficulty ?? DEFAULT_QUIZ_CONFIG.difficulty,
      number_of_questions: payload.number_of_questions ?? DEFAULT_QUIZ_CONFIG.number_of_questions,
    };
    const response = await apiClient.post(ENDPOINTS.diagnostic.generateQuiz, body);
    const data = response.data as { questions?: DiagnosticQuestion[] };
    const questions = Array.isArray(data?.questions) ? data.questions : [];
    return questions;
  },

  // Get diagnostic quiz for a single subject (AI first, then backend POST with new schema)
  getDiagnosticQuiz: async (subject: string, topic?: string): Promise<DiagnosticQuestion[]> => {
    const effectiveTopic = topic?.trim() ? topic : DEFAULT_QUIZ_CONFIG.topic;
    const requestBody = {
      subjects: [normalizeSubjects([subject])[0]],
      topic: effectiveTopic,
      difficulty: DEFAULT_QUIZ_CONFIG.difficulty,
      number_of_questions: DEFAULT_QUIZ_CONFIG.number_of_questions,
    };
    try {
      const aiResponse = await aiEngineApi.generateQuiz(requestBody);
      return aiResponse.questions.map((q) => ({
        subject: q.subject,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        allocated_time: q.allocated_time ?? 60,
        explanation: (q as { explanation?: string }).explanation,
      }));
    } catch (aiError) {
      console.warn("[Quiz] AI Engine failed, using fallback:", aiError);
    }
    try {
      const questions = await apiClient
        .post(ENDPOINTS.diagnostic.generateQuiz, requestBody)
        .then((r) => (r.data as { questions?: DiagnosticQuestion[] }).questions ?? []);
      if (questions.length > 0) return questions;
    } catch {
      // ignore
    }
    try {
      const response = await apiClient.get(ENDPOINTS.diagnostic.getQuiz(subject));
      const data = response.data;
      const questions = Array.isArray(data) ? data : (data as { questions?: DiagnosticQuestion[] })?.questions ?? [];
      return questions;
    } catch (backendError) {
      console.warn("[Quiz] Backend failed:", backendError);
      return [];
    }
  },

  // Submit quiz results - store in localStorage for now since backend may not have endpoint
  submitResults: async (payload: QuizResultsPayload): Promise<void> => {
    try {
      // Try to submit to backend
      const response = await apiClient.post(ENDPOINTS.diagnostic.submitResults, payload);
      
      // Also store locally for persistence
      storeQuizResultsLocally(payload);
      
      return response.data;
    } catch (error) {
      console.warn("[Quiz] Backend submit failed, storing locally");
      // Store results locally when backend is unavailable
      storeQuizResultsLocally(payload);
      
      // Update AI Engine with progress if possible
      try {
        const { results } = payload;
        const correct = results.filter(r => r.userAnswer === r.correctAnswer).length;
        const total = results.length;
        
        const userId = useUserStore.getState().user_id || "anonymous";
        const subject = results[0]?.subject || "general";
        
        // Fire and forget - don't block on this
        aiEngineApi.updateProgress({
          student_id: userId,
          subject,
          topic: "diagnostic_quiz",
          mastery_score: Math.round((correct / total) * 100),
        }).catch((err) => {
          // Log but don't throw - progress update failure shouldn't break the app
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 422) {
            console.warn("[Quiz] AI Progress update validation error");
          } else if (status === 500) {
            console.warn("[Quiz] AI Progress update server error - student not registered");
          }
        });
      } catch {
        // Silent fail for progress update
      }
    }
  },
  
  // Generate practice quiz - ALWAYS uses AI Engine
  generatePracticeQuiz: async (
    subject: string, 
    topic: string, 
    difficulty: "easy" | "medium" | "hard" = "medium",
    questionCount: number = 5
  ): Promise<DiagnosticQuestion[]> => {
    const aiResponse = await aiEngineApi.generateQuiz({
      subjects: [subject],  // subjects must be an array
      topic: topic && topic.trim() !== "" ? topic : "General",
      difficulty,
      number_of_questions: questionCount,
    });
    
    return aiResponse.questions.map((q) => ({
      subject: q.subject,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      allocated_time: q.allocated_time || 60,
    }));
  },
};

// Helper to store quiz results in localStorage
function storeQuizResultsLocally(payload: QuizResultsPayload): void {
  const stored = localStorage.getItem("propella_quiz_history");
  const history = stored ? JSON.parse(stored) : [];
  
  history.push({
    id: `quiz_${Date.now()}`,
    timestamp: new Date().toISOString(),
    results: payload.results,
    summary: {
      total: payload.results.length,
      correct: payload.results.filter(r => r.userAnswer === r.correctAnswer).length,
      subject: payload.results[0]?.subject || "general",
    },
  });
  
  // Keep only last 50 quizzes
  if (history.length > 50) {
    history.shift();
  }
  
  localStorage.setItem("propella_quiz_history", JSON.stringify(history));
}

export default quizApi;
