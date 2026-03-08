import apiClient from "./client";
import aiEngineApi from "./ai-engine.api";
import { ENDPOINTS } from "@/config/endpoints";
import type { TodayRoadmapResponse, RoadmapDay, RoadmapTask } from "@/types/api.types";

// Constants
const ROADMAP_CACHE_KEY = "propella_roadmap_cache";
const ROADMAP_GENERATION_STATUS = "propella_roadmap_status";

export const roadmapApi = {
  // Get today's roadmap - POWERED BY AI ENGINE
  getTodayRoadmap: async (): Promise<TodayRoadmapResponse> => {
    try {
      // First try backend
      const response = await apiClient.get(ENDPOINTS.roadmap.getToday);
      return response.data;
    } catch (backendError) {
      console.warn("[Roadmap] Backend unavailable, using AI Engine or cache");
      
      // Try to get from cache first
      const cached = getCachedRoadmap();
      if (cached && cached.days.length > 0) {
        return transformToTodayResponse(cached.days[0], "ready");
      }
      
      // Generate new roadmap using AI Engine
      try {
        const generatedRoadmap = await generateRoadmapWithAI();
        cacheRoadmap(generatedRoadmap);
        return transformToTodayResponse(generatedRoadmap.days[0], "ready");
      } catch (aiError) {
        console.error("[Roadmap] AI Engine failed:", aiError);
        // Return fallback roadmap
        return getFallbackTodayRoadmap();
      }
    }
  },

  // Get roadmap for a specific day
  getRoadmapByDay: async (dayId: string): Promise<RoadmapDay> => {
    try {
      const response = await apiClient.get(ENDPOINTS.roadmap.getByDay(dayId));
      return response.data;
    } catch (error) {
      console.warn("[Roadmap] Backend failed, using cache or fallback");
      
      // Try cache first
      const cached = getCachedRoadmap();
      if (cached) {
        const day = cached.days.find((d) => d.id === dayId || d.day === parseInt(dayId));
        if (day) {
          return transformAiDayToRoadmapDay(day);
        }
      }
      
      // Return fallback day
      return getFallbackRoadmapDay(parseInt(dayId) || 1);
    }
  },

  // Complete a task
  completeTask: async (taskId: string): Promise<void> => {
    try {
      const response = await apiClient.post(ENDPOINTS.roadmap.completeTask(taskId));
      return response.data;
    } catch (error) {
      console.warn("[Roadmap] Backend complete task failed, updating locally");
      // Update local cache to mark task as complete
      updateLocalTaskStatus(taskId, "completed");
    }
  },
  
  // Generate full roadmap using AI Engine
  generateRoadmap: async (): Promise<{ days: RoadmapDay[] }> => {
    try {
      const roadmap = await generateRoadmapWithAI();
      cacheRoadmap(roadmap);
      // Convert phases to days
      const days = (roadmap.phases || []).map((phase, index) => ({
        id: `day_${index + 1}`,
        day_number: index + 1,
        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        notes: phase.description,
        tasks: [{
          id: `task_${index + 1}_1`,
          title: phase.title,
          description: phase.description,
          type: "study" as const,
          status: "pending" as const,
          duration: 60,
          subject_id: "general",
          topic_id: "",
        }],
        quiz: {
          id: `quiz_day_${index + 1}`,
          title: `Day ${index + 1} Quiz`,
          total_questions: 5,
        },
        progress: 0,
        is_unlocked: index === 0,
        is_completed: false,
      }));
      return { days };
    } catch (error) {
      console.error("[Roadmap] Generation failed:", error);
      return { days: getFallbackRoadmapDays() };
    }
  },
  
  // Get generation status
  getGenerationStatus: (): { status: "loading" | "ready" | "error"; progress?: number } => {
    const status = localStorage.getItem(ROADMAP_GENERATION_STATUS);
    if (status) {
      return JSON.parse(status);
    }
    return { status: "ready" };
  },
  
  // Clear cached roadmap
  clearCache: (): void => {
    localStorage.removeItem(ROADMAP_CACHE_KEY);
    localStorage.removeItem(ROADMAP_GENERATION_STATUS);
  },
};

// Extended cached roadmap type with days
interface CachedRoadmapDay {
  id: string;
  day: number;
  date: string;
  subjects: string[];
  topics: string[];
  estimated_time: number;
  difficulty: string;
  tasks?: Array<{
    id: string;
    status: string;
  }>;
}

interface CachedRoadmap {
  days: CachedRoadmapDay[];
  phases?: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  cached_at: string;
}

// Generate roadmap using AI Engine
async function generateRoadmapWithAI(): Promise<CachedRoadmap> {
  // Get user profile data
  const examDate = localStorage.getItem("propella_exam_date") || getDefaultExamDate();
  const subjects = JSON.parse(localStorage.getItem("propella_subjects") || '["Mathematics", "English"]');
  
  // Set generation status
  localStorage.setItem(ROADMAP_GENERATION_STATUS, JSON.stringify({ status: "loading", progress: 0 }));
  
  try {
    const response = await aiEngineApi.generateRoadmap({
      subjects,
      exam_date: examDate,
      goal: "Prepare for JAMB exam",
    });
    
    localStorage.setItem(ROADMAP_GENERATION_STATUS, JSON.stringify({ status: "ready", progress: 100 }));
    
    // Convert phases to days for caching
    const days: CachedRoadmapDay[] = response.phases.map((phase, index) => ({
      id: `day_${index + 1}`,
      day: index + 1,
      date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      subjects: subjects.slice(0, 2),
      topics: [phase.title, phase.description],
      estimated_time: 120,
      difficulty: "medium",
    }));
    
    return {
      days,
      phases: response.phases,
      cached_at: new Date().toISOString(),
    };
  } catch (error) {
    localStorage.setItem(ROADMAP_GENERATION_STATUS, JSON.stringify({ status: "error", progress: 0 }));
    throw error;
  }
}

// Cache helpers
function getCachedRoadmap(): CachedRoadmap | null {
  const cached = localStorage.getItem(ROADMAP_CACHE_KEY);
  return cached ? JSON.parse(cached) : null;
}

function cacheRoadmap(roadmap: CachedRoadmap) {
  localStorage.setItem(ROADMAP_CACHE_KEY, JSON.stringify(roadmap));
}

function updateLocalTaskStatus(taskId: string, status: string) {
  const cached = getCachedRoadmap();
  if (cached) {
    // Find and update the task in the cached roadmap
    cached.days.forEach((day) => {
      if (day.tasks) {
        const task = day.tasks.find((t) => t.id === taskId);
        if (task) {
          task.status = status;
        }
      }
    });
    cacheRoadmap(cached);
  }
}

// Transform AI Engine response to TodayRoadmapResponse
function transformToTodayResponse(
  day: { day: number; date: string; subjects: string[]; topics: string[]; estimated_time: number; difficulty: string },
  status: "loading" | "ready" | "error"
): TodayRoadmapResponse {
  return {
    notes: `Day ${day.day}: Focus on ${day.subjects.join(", ")}. Topics: ${day.topics.join(", ")}`,
    quiz: {
      id: `quiz_day_${day.day}`,
      title: `Daily Quiz - Day ${day.day}`,
      total_questions: 5,
    },
    progress: 0,
    tasks: day.topics.map((topic, index) => ({
      id: `task_${day.day}_${index}`,
      title: `Study: ${topic}`,
      description: `Learn about ${topic} in ${day.subjects[Math.floor(index / 2)] || day.subjects[0]}`,
      type: index % 3 === 0 ? "quiz" : index % 3 === 1 ? "study" : "revision",
      status: "pending",
      duration: Math.round(day.estimated_time / day.topics.length),
      subject_id: day.subjects[Math.floor(index / 2)] || day.subjects[0],
      topic_id: topic,
    })),
    generation_status: status,
  };
}

// Transform AI Engine day to RoadmapDay
function transformAiDayToRoadmapDay(day: { day: number; date: string; subjects: string[]; topics: string[]; estimated_time: number; difficulty: string }): RoadmapDay {
  const tasks: RoadmapTask[] = day.topics.map((topic, index) => ({
    id: `task_${day.day}_${index}`,
    title: `Study: ${topic}`,
    description: `Learn about ${topic}`,
    type: index % 3 === 0 ? "quiz" : index % 3 === 1 ? "study" : "revision",
    status: "pending",
    duration: Math.round(day.estimated_time / day.topics.length),
    subject_id: day.subjects[Math.floor(index / 2)] || day.subjects[0],
    topic_id: topic,
  }));
  
  return {
    id: `day_${day.day}`,
    day_number: day.day,
    date: day.date,
    notes: `Focus on ${day.subjects.join(", ")}`,
    tasks,
    quiz: {
      id: `quiz_day_${day.day}`,
      title: `Daily Quiz - Day ${day.day}`,
      total_questions: 5,
    },
    progress: 0,
    is_unlocked: day.day === 1,
    is_completed: false,
  };
}

// Get default exam date (3 months from now)
function getDefaultExamDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().split("T")[0];
}

// Fallback data
function getFallbackTodayRoadmap(): TodayRoadmapResponse {
  return {
    notes: "Welcome to your personalized study plan! Start with Mathematics fundamentals and English comprehension.",
    quiz: {
      id: "quiz_day_1",
      title: "Diagnostic Quiz - Day 1",
      total_questions: 10,
    },
    progress: 0,
    tasks: [
      {
        id: "task_1_1",
        title: "Mathematics: Algebra Basics",
        description: "Learn fundamental algebraic concepts including variables, equations, and expressions.",
        type: "study",
        status: "pending",
        duration: 45,
        subject_id: "mathematics",
        topic_id: "algebra_basics",
      },
      {
        id: "task_1_2",
        title: "English: Reading Comprehension",
        description: "Practice reading passages and answering comprehension questions.",
        type: "study",
        status: "pending",
        duration: 30,
        subject_id: "english",
        topic_id: "reading_comprehension",
      },
      {
        id: "task_1_3",
        title: "Daily Quiz",
        description: "Test your knowledge with today's quiz questions.",
        type: "quiz",
        status: "pending",
        duration: 20,
        subject_id: "general",
        topic_id: "daily_quiz",
      },
    ],
    generation_status: "ready",
  };
}

function getFallbackRoadmapDay(dayNumber: number): RoadmapDay {
  const subjects = ["Mathematics", "English", "Physics", "Chemistry", "Biology"];
  const subject = subjects[(dayNumber - 1) % subjects.length];
  
  return {
    id: `day_${dayNumber}`,
    day_number: dayNumber,
    date: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: `Focus on ${subject} fundamentals`,
    tasks: [
      {
        id: `task_${dayNumber}_1`,
        title: `${subject}: Core Concepts`,
        description: `Study core concepts in ${subject}`,
        type: "study",
        status: "pending",
        duration: 45,
        subject_id: subject.toLowerCase(),
        topic_id: "core_concepts",
      },
      {
        id: `task_${dayNumber}_2`,
        title: `${subject}: Practice Problems`,
        description: `Solve practice problems`,
        type: "quiz",
        status: "pending",
        duration: 30,
        subject_id: subject.toLowerCase(),
        topic_id: "practice",
      },
      {
        id: `task_${dayNumber}_3`,
        title: "Revision",
        description: "Review today's learning",
        type: "revision",
        status: "pending",
        duration: 15,
        subject_id: subject.toLowerCase(),
        topic_id: "revision",
      },
    ],
    quiz: {
      id: `quiz_day_${dayNumber}`,
      title: `Daily Quiz - Day ${dayNumber}`,
      total_questions: 5,
    },
    progress: 0,
    is_unlocked: dayNumber === 1,
    is_completed: false,
  };
}

function getFallbackRoadmapDays(): RoadmapDay[] {
  return Array.from({ length: 30 }, (_, i) => getFallbackRoadmapDay(i + 1));
}

export default roadmapApi;
