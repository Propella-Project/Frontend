/**
 * Mock Data for MSW Handlers
 * Provides fallback data when backend APIs are unavailable
 */

import type { 
  DashboardResponse, 
  UserLevelResponse, 
  PerformanceDataPoint,
  TodayRoadmapResponse,
  StreakResponse,
} from "@/types/api.types";

// Local type definitions for mock data
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  duration_days: number;
  features: string[];
}

interface ReferralStats {
  user: {
    id: string;
    nickname: string;
    referral_code: string;
    referral_points: number;
    total_referrals: number;
    estimated_earnings: number;
  };
  referrals: Array<{
    id: string;
    nickname: string;
    date: string;
    points_earned: number;
  }>;
}

// Dashboard Data
export const mockDashboardData: DashboardResponse = {
  nickname: "Demo Student",
  rank: "Rising Star",
  level: 5,
  points: 1250,
  average_score: 78,
  completed_days: 12,
  pending_tasks: 3,
  streak: 7,
};

export const mockUserLevel: UserLevelResponse = {
  level: 5,
  points: 1250,
  next_level_points: 2000,
  progress_percentage: 62.5,
};

export const mockPerformanceData: PerformanceDataPoint[] = [
  { date: "2026-02-28", score: 65 },
  { date: "2026-03-01", score: 72 },
  { date: "2026-03-02", score: 68 },
  { date: "2026-03-03", score: 75 },
  { date: "2026-03-04", score: 80 },
  { date: "2026-03-05", score: 78 },
  { date: "2026-03-06", score: 85 },
];

// Subscription Plans
export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: "monthly",
    name: "Monthly Plan",
    description: "Full access for 1 month with all features",
    amount: 1499,
    currency: "NGN",
    duration_days: 30,
    features: [
      "Personalized AI-generated roadmap",
      "Unlimited AI tutor chat sessions",
      "Detailed performance analytics",
      "Weak topics identification",
      "Daily streak tracking",
      "Practice quizzes and past questions",
      "Study recommendations",
      "Progress tracking",
    ],
  },
  {
    id: "quarterly",
    name: "Quarterly Plan",
    description: "Full access for 3 months - Save 15%",
    amount: 3825,
    currency: "NGN",
    duration_days: 90,
    features: [
      "Everything in Monthly Plan",
      "15% discount on regular price",
      "Priority AI tutor responses",
      "Extended quiz history",
      "Advanced analytics dashboard",
    ],
  },
  {
    id: "yearly",
    name: "Yearly Plan",
    description: "Full access for 12 months - Best Value!",
    amount: 11988,
    currency: "NGN",
    duration_days: 365,
    features: [
      "Everything in Quarterly Plan",
      "33% discount on regular price",
      "Exclusive study materials",
      "1-on-1 mentorship sessions",
      "Custom study plans",
      "Exam simulation tests",
    ],
  },
];

// Referral Data
export const mockReferralStats: ReferralStats = {
  user: {
    id: "user_demo_123",
    nickname: "Demo Student",
    referral_code: "PROP2026ABC",
    referral_points: 150,
    total_referrals: 5,
    estimated_earnings: 450, // 150 points × ₦3
  },
  referrals: [
    { id: "ref_1", nickname: "John D.", date: "2026-03-01", points_earned: 30 },
    { id: "ref_2", nickname: "Sarah M.", date: "2026-03-02", points_earned: 30 },
    { id: "ref_3", nickname: "Mike K.", date: "2026-03-03", points_earned: 30 },
    { id: "ref_4", nickname: "Emma W.", date: "2026-03-05", points_earned: 30 },
    { id: "ref_5", nickname: "Alex R.", date: "2026-03-06", points_earned: 30 },
  ],
};

// Streak Data
export const mockStreakData: StreakResponse = {
  current_streak: 7,
  longest_streak: 14,
  last_study_date: new Date().toISOString().split("T")[0],
  streak_multiplier: 1.5,
};

// Today's Roadmap (Fallback)
export const mockTodayRoadmap: TodayRoadmapResponse = {
  notes: "Today focuses on Mathematics and English fundamentals. Complete all tasks to maintain your streak!",
  quiz: {
    id: "quiz_today",
    title: "Daily Challenge Quiz",
    total_questions: 10,
  },
  progress: 0,
  tasks: [
    {
      id: "task_1",
      title: "Mathematics: Algebra Fundamentals",
      description: "Learn about linear equations, variables, and basic algebraic operations.",
      type: "study",
      status: "pending",
      duration: 45,
      subject_id: "mathematics",
      topic_id: "algebra_basics",
    },
    {
      id: "task_2",
      title: "English: Reading Comprehension",
      description: "Practice reading passages and answering questions.",
      type: "study",
      status: "pending",
      duration: 30,
      subject_id: "english",
      topic_id: "reading_comprehension",
    },
    {
      id: "task_3",
      title: "Practice Quiz: Mixed Topics",
      description: "Test your knowledge with 10 mixed questions.",
      type: "quiz",
      status: "pending",
      duration: 20,
      subject_id: "general",
      topic_id: "mixed_quiz",
    },
    {
      id: "task_4",
      title: "Revision Session",
      description: "Review yesterday's topics and weak areas.",
      type: "revision",
      status: "pending",
      duration: 15,
      subject_id: "general",
      topic_id: "revision",
    },
  ],
  generation_status: "ready",
};

// User Profile
export const mockUserProfile = {
  user_id: "user_demo_123",
  username: "demostudent",
  nickname: "Demo Student",
  email: "demo@propella.ng",
  rank: "Rising Star",
  level: 5,
  points: 1250,
  streak: 7,
  subjects: ["Mathematics", "English", "Physics"],
  ai_tutor_selected: "Professor Wisdom",
  ai_voice_enabled: false,
  payment_status: "paid" as const,
  exam_date: "2026-06-15",
  study_hours_per_day: 4,
};

// Auth Response
export const mockAuthResponse = {
  access: "mock_access_token_" + Date.now(),
  refresh: "mock_refresh_token_" + Date.now(),
  user: mockUserProfile,
};

// Subscription Status
export const mockSubscriptionStatus = {
  has_active_subscription: true,
  subscription: {
    id: "sub_demo_123",
    user_id: "user_demo_123",
    plan_id: "monthly",
    status: "active" as const,
    start_date: "2026-03-01",
    end_date: "2026-03-31",
    created_at: "2026-03-01T10:00:00Z",
  },
  days_remaining: 24,
};

// Weak Topics
export const mockWeakTopics = [
  {
    id: "wt_1",
    subject: "Mathematics",
    topic: "Quadratic Equations",
    weakness_score: 65,
    recommended_action: "Practice 5 problems daily",
  },
  {
    id: "wt_2",
    subject: "Physics",
    topic: "Kinematics",
    weakness_score: 58,
    recommended_action: "Review fundamental formulas",
  },
  {
    id: "wt_3",
    subject: "English",
    topic: "Grammar",
    weakness_score: 72,
    recommended_action: "Complete grammar exercises",
  },
];

// Assignments
export const mockAssignments = [
  {
    id: "assign_1",
    title: "Algebra Practice Set",
    description: "Solve 10 quadratic equations",
    subject_id: "mathematics",
    topic_id: "quadratic_equations",
    type: "quiz" as const,
    assigned_by: "ai" as const,
    assigned_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 86400000).toISOString(),
    completed_at: null,
    status: "pending" as const,
    points: 50,
  },
  {
    id: "assign_2",
    title: "Physics Formula Review",
    description: "Memorize key kinematics formulas",
    subject_id: "physics",
    topic_id: "kinematics",
    type: "study" as const,
    assigned_by: "ai" as const,
    assigned_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 172800000).toISOString(),
    completed_at: null,
    status: "pending" as const,
    points: 30,
  },
];

// Notifications
export const mockNotifications = [
  {
    id: "notif_1",
    title: "Daily Streak Alert! 🔥",
    message: "You're on a 7-day streak! Keep it up to earn bonus points.",
    type: "streak_alert" as const,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "notif_2",
    title: "New Assignment Available",
    message: "AI Tutor has assigned you a new Mathematics practice set.",
    type: "task_reminder" as const,
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif_3",
    title: "Weekly Progress Report",
    message: "You've completed 85% of this week's tasks. Great job!",
    type: "general" as const,
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];
