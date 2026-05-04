// API Response Types

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Dashboard Types
export interface DashboardResponse {
  nickname: string;
  rank: string;
  level: number;
  points: number;
  average_score: number;
  completed_days: number;
  pending_tasks: number;
  streak: number;
}

// User Profile Types
export interface UserProfile {
  user_id: string;
  username?: string;  // From backend registration
  nickname: string;
  email?: string;  // For Flutterwave customer field
  rank: string;
  level: number;
  points: number;
  streak: number;
  subjects: string[];
  ai_tutor_selected: string;
  ai_voice_enabled: boolean;
  payment_status: "pending" | "paid" | "failed";
  exam_date?: string;
  study_hours_per_day?: number;
}

export interface ExamProfilePayload {
  user?: number;
  nickname?: string;
  exam_date: string;  // YYYY-MM-DD
  daily_hours?: number;  // Legacy field - use study_hours_per_day instead
  study_hours_per_day: number;  // Backend expects this field name
  personality?: string;
  ai_tutor_selected?: string;
  ai_voice_enabled?: boolean;
}

export interface UserSubjectsPayload {
  subjects: string[];
}

// Diagnostic Quiz Types (matches backend schema: options "A) ...", correct_answer "A"|"B"|"C"|"D")
export interface DiagnosticQuestion {
  subject: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  allocated_time: number;
}

export interface QuizResultItem {
  subject: string;
  question: string;
  timeUsed: number;
  userAnswer: string;
  correctAnswer: string;
}

export interface QuizResultsPayload {
  results: QuizResultItem[];
}

// Study roadmap (Propella AI Engine — persisted in Supabase)
export interface RoadmapProgress {
  completed_phase_orders: number[];
  current_phase_order: number | null;
}

/** One task inside a phase from POST/GET `/study/roadmap*` */
export interface StudyRoadmapPhaseTask {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  subject?: string;
  subject_id?: string;
  topic?: string;
  topic_id?: string;
  duration?: number;
  duration_minutes?: number;
}

export interface StudyRoadmapPhase {
  order: number;
  date?: string;
  is_rest?: boolean;
  title: string;
  description: string;
  study_notes?: string;
  tasks?: StudyRoadmapPhaseTask[];
}

export interface RoadmapResponse {
  user_id?: string;
  phases: StudyRoadmapPhase[];
  roadmap_id?: string | null;
  saved?: boolean;
  progress?: RoadmapProgress | null;
  exam_date?: string;
  subjects?: string[];
  goal?: string | null;
}

export interface StudyRoadmapGeneratePayload {
  user_id: string;
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

export interface StudyRoadmapProgressMergePayload {
  user_id: string;
  roadmap_id: string;
  mark_complete?: number[];
  mark_incomplete?: number[];
  update_current?: boolean;
  current_phase_order?: number | null;
}

// Roadmap Types
export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  type: "study" | "quiz" | "revision" | "flashcard" | "assignment" | "practice";
  status: "pending" | "in_progress" | "completed";
  duration: number;  // in minutes
  duration_minutes?: number;  // alias for duration
  subject_id: string;
  topic_id: string;
  is_completed?: boolean;  // computed from status === "completed"
}

export interface RoadmapDay {
  id: string;
  day_number: number;
  title?: string;  // optional title for the day
  date: string;
  notes: string;
  tasks: RoadmapTask[];
  quiz?: {
    id: string;
    title: string;
    total_questions: number;
  };
  progress: number;
  is_unlocked: boolean;
  is_completed: boolean;
  estimated_hours?: number;  // estimated study hours for the day
}

export interface TodayRoadmapResponse {
  id?: string;  // optional for compatibility with RoadmapDay
  day_number?: number;  // optional for compatibility with RoadmapDay
  date?: string;  // optional for compatibility with RoadmapDay
  notes: string;
  quiz: {
    id: string;
    title: string;
    total_questions: number;
  } | null;
  progress: number;
  tasks: RoadmapTask[];
  generation_status: "loading" | "ready" | "error";
  is_unlocked?: boolean;  // optional for compatibility with RoadmapDay
  is_completed?: boolean;  // optional for compatibility with RoadmapDay
}

// Performance Types
export interface PerformanceDataPoint {
  date: string;
  score: number;
}

export interface UserLevelResponse {
  level: number;
  points: number;
  next_level_points: number;
  progress_percentage: number;
}

// Streak Types
export interface StreakResponse {
  current_streak: number;
  longest_streak: number;
  last_study_date: string;
  streak_multiplier: number;
}

// AI Tutor Types
export interface TutorChatPayload {
  message: string;
  session_id?: string;
}

export interface TutorChatResponse {
  response: string;
  session_id: string;
  type: "text" | "explanation" | "song" | "flashcard" | "diagram";
  metadata?: {
    suggested_topics?: string[];
    follow_up_questions?: string[];
  };
}

// Weak Topics & Assignments
export interface WeakTopic {
  id: string;
  subject: string;
  topic: string;
  weakness_score: number;
  recommended_action: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  topic_id: string;
  type: "study" | "quiz" | "revision" | "reinforcement";
  assigned_by: "ai" | "system";
  assigned_at: string;
  due_date: string;
  completed_at: string | null;
  status: "pending" | "in_progress" | "completed" | "overdue";
  points: number;
}

// Payment Types
export interface PaymentInitiatePayload {
  amount: number;
  currency?: string;
  email: string;
  phone_number?: string;
  name: string;
  plan_id?: string;
}

export interface PaymentInitiateResponse {
  payment_link: string;
  transaction_ref: string;
}

export interface PaymentVerifyResponse {
  status: "success" | "failed" | "pending";
  transaction_ref: string;
  amount: number;
  payment_date: string;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "app_update" | "task_reminder" | "streak_alert" | "payment" | "general";
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

// Profile Update Types (How_it_works.md §8: PUT /accounts/edit-user/)
export interface ProfileUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  ai_tutor_selected?: string;
  ai_voice_enabled?: boolean;
}

// Loading States
export type LoadingState = "idle" | "loading" | "success" | "error";

// API Hook Return Types
export interface ApiHookState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface ApiHookReturn<T, P = void> extends ApiHookState<T> {
  execute: (payload?: P) => Promise<void>;
  reset: () => void;
}
