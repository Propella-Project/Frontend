import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  TodayRoadmapResponse,
  RoadmapDay,
  PerformanceDataPoint,
  WeakTopic,
  Assignment,
  Notification,
} from "@/types/api.types";

// Quiz progress tracking
interface QuizProgress {
  quizId: string;
  currentQuestion: number;
  answers: Record<number, string>;
  timeRemaining: number;
  isCompleted: boolean;
}

// Tutor chat session
interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  type: "text" | "explanation" | "song" | "flashcard" | "diagram";
}

// Diagnostic quiz types
interface DiagnosticQuiz {
  questions: Array<{
    subject: string;
    question: string;
    options: string[];
    correct_answer: string;
    allocated_time: number;
  }>;
  currentSubjectIndex: number;
  answers: Array<{
    subject: string;
    question: string;
    timeUsed: number;
    userAnswer: string;
    correctAnswer: string;
  }>;
}

interface DiagnosticAnswer {
  subject: string;
  question: string;
  timeUsed: number;
  userAnswer: string;
  correctAnswer: string;
}

interface AppState {
  // Roadmap data
  roadmap: RoadmapDay[];
  todayRoadmap: TodayRoadmapResponse | null;
  
  // Tasks
  todayTasks: TodayRoadmapResponse["tasks"];
  
  // Quiz progress
  quizProgress: QuizProgress | null;
  
  // Diagnostic quiz state
  diagnosticQuiz: DiagnosticQuiz | null;
  
  // Tutor chat session
  tutorSession: ChatMessage[];
  tutorSessionId: string | null;
  
  // Weak topics
  weakTopics: WeakTopic[];
  
  // Notifications
  notifications: Notification[];
  unreadNotificationsCount: number;
  
  // Payment status
  paymentStatus: "pending" | "paid" | "failed";
  
  // Roadmap generation status
  roadmapGenerationStatus: "loading" | "ready" | "error";
  
  // Performance graph data
  performanceGraph: PerformanceDataPoint[];
  
  // Assignments
  assignments: Assignment[];
  
  // Global loading states
  isInitializing: boolean;
  isLoadingRoadmap: boolean;
  isLoadingTutor: boolean;
  
  // Actions
  setRoadmap: (roadmap: RoadmapDay[]) => void;
  setTodayRoadmap: (roadmap: TodayRoadmapResponse | null) => void;
  setTodayTasks: (tasks: TodayRoadmapResponse["tasks"]) => void;
  setQuizProgress: (progress: QuizProgress | null) => void;
  updateQuizAnswer: (questionIndex: number, answer: string) => void;
  setDiagnosticQuiz: (quiz: DiagnosticQuiz | null) => void;
  addDiagnosticAnswer: (answer: DiagnosticAnswer) => void;
  addTutorMessage: (message: ChatMessage) => void;
  setTutorSessionId: (sessionId: string | null) => void;
  clearTutorSession: () => void;
  setWeakTopics: (topics: WeakTopic[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationAsRead: (notificationId: string) => void;
  addNotification: (notification: Notification) => void;
  setPaymentStatus: (status: AppState["paymentStatus"]) => void;
  setRoadmapGenerationStatus: (status: AppState["roadmapGenerationStatus"]) => void;
  setPerformanceGraph: (data: PerformanceDataPoint[]) => void;
  setAssignments: (assignments: Assignment[]) => void;
  completeAssignment: (assignmentId: string) => void;
  setIsInitializing: (value: boolean) => void;
  setIsLoadingRoadmap: (value: boolean) => void;
  setIsLoadingTutor: (value: boolean) => void;
  resetAppState: () => void;
}

const initialState: Omit<
  AppState,
  | "setRoadmap"
  | "setTodayRoadmap"
  | "setTodayTasks"
  | "setQuizProgress"
  | "updateQuizAnswer"
  | "setDiagnosticQuiz"
  | "addDiagnosticAnswer"
  | "addTutorMessage"
  | "setTutorSessionId"
  | "clearTutorSession"
  | "setWeakTopics"
  | "setNotifications"
  | "markNotificationAsRead"
  | "addNotification"
  | "setPaymentStatus"
  | "setRoadmapGenerationStatus"
  | "setPerformanceGraph"
  | "setAssignments"
  | "completeAssignment"
  | "setIsInitializing"
  | "setIsLoadingRoadmap"
  | "setIsLoadingTutor"
  | "resetAppState"
> = {
  roadmap: [],
  todayRoadmap: null,
  todayTasks: [],
  quizProgress: null,
  diagnosticQuiz: null,
  tutorSession: [],
  tutorSessionId: null,
  weakTopics: [],
  notifications: [],
  unreadNotificationsCount: 0,
  paymentStatus: "pending",
  roadmapGenerationStatus: "loading",
  performanceGraph: [],
  assignments: [],
  isInitializing: true,
  isLoadingRoadmap: false,
  isLoadingTutor: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setRoadmap: (roadmap) => {
        set({ roadmap });
      },

      setTodayRoadmap: (todayRoadmap) => {
        set({ 
          todayRoadmap,
          todayTasks: todayRoadmap?.tasks || [],
          roadmapGenerationStatus: todayRoadmap?.generation_status || "ready",
        });
      },

      setTodayTasks: (tasks) => {
        set({ todayTasks: tasks });
      },

      setQuizProgress: (progress) => {
        set({ quizProgress: progress });
      },

      updateQuizAnswer: (questionIndex, answer) => {
        set((state) => ({
          quizProgress: state.quizProgress
            ? {
                ...state.quizProgress,
                answers: {
                  ...state.quizProgress.answers,
                  [questionIndex]: answer,
                },
              }
            : null,
        }));
      },

      setDiagnosticQuiz: (quiz) => {
        set({ diagnosticQuiz: quiz });
      },

      addDiagnosticAnswer: (answer) => {
        set((state) => ({
          diagnosticQuiz: state.diagnosticQuiz
            ? {
                ...state.diagnosticQuiz,
                answers: [...state.diagnosticQuiz.answers, answer],
              }
            : null,
        }));
      },

      addTutorMessage: (message) => {
        set((state) => ({
          tutorSession: [...state.tutorSession, message],
        }));
      },

      setTutorSessionId: (sessionId) => {
        set({ tutorSessionId: sessionId });
      },

      clearTutorSession: () => {
        set({ tutorSession: [], tutorSessionId: null });
      },

      setWeakTopics: (topics) => {
        set({ weakTopics: topics });
      },

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.is_read).length;
        set({ 
          notifications,
          unreadNotificationsCount: unreadCount,
        });
      },

      markNotificationAsRead: (notificationId) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          );
          return {
            notifications: updatedNotifications,
            unreadNotificationsCount: updatedNotifications.filter((n) => !n.is_read).length,
          };
        });
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadNotificationsCount: state.unreadNotificationsCount + (notification.is_read ? 0 : 1),
        }));
      },

      setPaymentStatus: (status) => {
        set({ paymentStatus: status });
      },

      setRoadmapGenerationStatus: (status) => {
        set({ roadmapGenerationStatus: status });
      },

      setPerformanceGraph: (data) => {
        set({ performanceGraph: data });
      },

      setAssignments: (assignments) => {
        set({ assignments });
      },

      completeAssignment: (assignmentId) => {
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === assignmentId
              ? { ...a, status: "completed", completed_at: new Date().toISOString() }
              : a
          ),
        }));
      },

      setIsInitializing: (value) => {
        set({ isInitializing: value });
      },

      setIsLoadingRoadmap: (value) => {
        set({ isLoadingRoadmap: value });
      },

      setIsLoadingTutor: (value) => {
        set({ isLoadingTutor: value });
      },

      resetAppState: () => {
        set({
          ...initialState,
          isInitializing: false,
        });
      },
    }),
    {
      name: "propella-app-store",
      partialize: (state) => ({
        roadmap: state.roadmap,
        tutorSession: state.tutorSession,
        tutorSessionId: state.tutorSessionId,
        paymentStatus: state.paymentStatus,
        performanceGraph: state.performanceGraph,
      }),
    }
  )
);
