import axios from "axios";
import type { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import { ENV } from "@/config/env";

// AI Engine API Client
export const aiEngineClient: AxiosInstance = axios.create({
  baseURL: ENV.AI_ENGINE_BASE_URL,
  timeout: ENV.AI_ENGINE_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": ENV.AI_ENGINE_API_KEY,
  },
});

// Response interceptor for error handling
aiEngineClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (!error.response) {
      console.error("AI Engine Network error - no response from server");
    } else {
      console.error("AI Engine API Error:", error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

// ==========================================
// QUIZ TYPES
// ==========================================

export interface QuizQuestion {
  subject: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  allocated_time: number;
}

export interface QuizGenerateRequest {
  subject: string;
  topic: string;  // Required by AI Engine
  difficulty?: "easy" | "medium" | "hard";
  number_of_questions?: number;
}

export interface QuizGenerateResponse {
  questions: QuizQuestion[];
}

// ==========================================
// CHAT TYPES
// ==========================================

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
  type?: "text" | "image" | "code";
}

export interface SendMessageRequest {
  message: string;
  chat_id?: string | null;
  tutor_personality?: "mc_flow" | "coach_victor" | "nana_aisha" | "sergeant_drill" | "professor_wisdom" | null;
  use_rag?: boolean;
}

export interface SendMessageResponse {
  chat_id: string;
  reply: string;
  messages: ChatMessage[];
}

// ==========================================
// ROADMAP TYPES
// ==========================================

export interface RoadmapGenerateRequest {
  subjects: string[];
  exam_date: string;
  goal?: string;
  quiz_result?: Array<{
    subject: string;
    question: string;
    options: string[];
    correct_answer: string;
    allocated_time?: number;
  }>;
}

export interface RoadmapPhase {
  order: number;
  title: string;
  description: string;
}

export interface RoadmapGenerateResponse {
  phases: RoadmapPhase[];
}

// ==========================================
// STUDY PLAN TYPES
// ==========================================

export interface StudyPlanRequest {
  student_id: string;
  subjects: string[];
  exam_date: string;
  daily_study_hours: number;
}

export interface StudyPlanTopic {
  [key: string]: unknown;
}

export interface StudyPlanDay {
  day: number;
  date: string;
  topics: StudyPlanTopic[];
}

export interface StudyPlanResponse {
  exam_date: string;
  days_remaining: number;
  schedule: StudyPlanDay[];
}

// ==========================================
// TUTOR EXPLAIN TYPES
// ==========================================

export interface TutorExplainRequest {
  subject: string;
  topic: string;
  subtopic?: string;
  student_level?: "beginner" | "intermediate" | "advanced";
}

export interface TutorExplainResponse {
  explanation: string;
  worked_example: string;
  practice_question: string;
}

// ==========================================
// PROGRESS TYPES
// ==========================================

export interface ProgressUpdateRequest {
  student_id: string;
  subject: string;
  topic: string;
  mastery_score: number;
}

export interface ProgressTopic {
  topic: string;
  mastery_score: number;
  last_studied_at: string;
}

export interface ProgressResponse {
  subject: string;
  topics: ProgressTopic[];
}

// ==========================================
// STUDY RECOMMENDATION TYPES
// ==========================================

export interface StudyRecommendationResponse {
  subject: string;
  recommended_topics: string[];
  reason: string;
}

// ==========================================
// STUDY TIP TYPES
// ==========================================

export interface StudyTipResponse {
  tip: string;
}

// ==========================================
// SYLLABUS TYPES
// ==========================================

export interface SyllabusResponse {
  syllabus: string;
}

export interface TopicsResponse {
  topics: string[];
}

export interface SubtopicsResponse {
  subtopics: string[];
}

// ==========================================
// AI ENGINE API FUNCTIONS
// ==========================================

export const aiEngineApi = {
  // ========== Quiz Generation ==========
  generateQuiz: async (
    request: QuizGenerateRequest
  ): Promise<QuizGenerateResponse> => {
    console.log("[AI Engine] Generating quiz:", JSON.stringify(request, null, 2));
    try {
      const response = await aiEngineClient.post<QuizGenerateResponse>(
        "/quiz/generate",
        request
      );
      return response.data;
    } catch (error) {
      console.error("[AI Engine] Quiz generation failed:", error.message);
      if (error.response?.status === 422) {
        console.error("[AI Engine] Validation error:", JSON.stringify(error.response?.data, null, 2));
      }
      throw error;
    }
  },

  // ========== Chat ==========
  sendMessage: async (
    request: SendMessageRequest
  ): Promise<SendMessageResponse> => {
    const response = await aiEngineClient.post<SendMessageResponse>(
      "/chat",
      request
    );
    return response.data;
  },

  // ========== Roadmap Generation ==========
  generateRoadmap: async (
    request: RoadmapGenerateRequest
  ): Promise<RoadmapGenerateResponse> => {
    const response = await aiEngineClient.post<RoadmapGenerateResponse>(
      "/study/roadmap",
      request
    );
    return response.data;
  },

  // ========== Study Plan ==========
  generateStudyPlan: async (
    request: StudyPlanRequest
  ): Promise<StudyPlanResponse> => {
    const response = await aiEngineClient.post<StudyPlanResponse>(
      "/study/plan",
      request
    );
    return response.data;
  },

  // ========== Tutor Explanation ==========
  explainTopic: async (
    request: TutorExplainRequest
  ): Promise<TutorExplainResponse> => {
    const response = await aiEngineClient.post<TutorExplainResponse>(
      "/tutor/explain",
      request
    );
    return response.data;
  },

  // ========== Progress ==========
  updateProgress: async (
    request: ProgressUpdateRequest
  ): Promise<{ message: string }> => {
    const response = await aiEngineClient.post<{ message: string }>(
      "/progress/update",
      request
    );
    return response.data;
  },

  getProgress: async (
    studentId: string,
    subject: string
  ): Promise<ProgressResponse> => {
    const response = await aiEngineClient.get<ProgressResponse>(
      `/progress/${studentId}/${subject}`
    );
    return response.data;
  },

  // ========== Study Recommendations ==========
  getStudyRecommendation: async (
    studentId: string,
    subject: string
  ): Promise<StudyRecommendationResponse> => {
    const response = await aiEngineClient.get<StudyRecommendationResponse>(
      `/study/recommendation/${studentId}/${subject}`
    );
    return response.data;
  },

  // ========== Study Tip ==========
  getStudyTip: async (
    subject: string,
    topic: string
  ): Promise<string> => {
    const response = await aiEngineClient.get<string>(
      `/study/tip?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`
    );
    return response.data;
  },

  // ========== Syllabus ==========
  getSyllabus: async (subject: string): Promise<string> => {
    const response = await aiEngineClient.get<string>(`/syllabus/${encodeURIComponent(subject)}`);
    return response.data;
  },

  getTopics: async (subject: string): Promise<string[]> => {
    const response = await aiEngineClient.get<string[]>(`/topics/${encodeURIComponent(subject)}`);
    return response.data;
  },

  getSubtopics: async (subject: string, topicName: string): Promise<string[]> => {
    const response = await aiEngineClient.get<string[]>(
      `/subtopics/${encodeURIComponent(subject)}/${encodeURIComponent(topicName)}`
    );
    return response.data;
  },

  // ========== Health Check ==========
  healthCheck: async (): Promise<{ status: string; version: string }> => {
    const response = await aiEngineClient.get<{ status: string; version: string }>("/health");
    return response.data;
  },
};

export default aiEngineApi;
