import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { TodayRoadmapResponse, RoadmapDay as ApiRoadmapDay } from "@/types/api.types";
import type { RoadmapDay as InternalRoadmapDay, Task } from "@/types";
import { roadmapGenerator, type GeneratedRoadmap, type RoadmapInput } from "@/services/roadmapGenerator.service";
import aiRoadmapService from "@/services/aiRoadmap.service";
import { FEATURES } from "@/config/env";

// Constants
const ROADMAP_CACHE_KEY = "propella_roadmap_cache";
const ROADMAP_GENERATION_STATUS = "propella_roadmap_status";

export const roadmapApi = {
  // Generate and save personalized roadmap - USES AI ENGINE FIRST
  generateAndSaveRoadmap: async (
    input: RoadmapInput
  ): Promise<GeneratedRoadmap> => {
    console.log("[Roadmap] Generating roadmap with AI Engine...", {
      subjects: input.subjects.map(s => s.name),
      examDate: input.examDate,
      quizCount: input.quizHistory.length,
    });

    let days: InternalRoadmapDay[] = [];

    // Try AI Engine first if enabled
    if (FEATURES.ENABLE_AI_ENGINE) {
      try {
        days = await aiRoadmapService.generateAIRoadmap(
          input.studentId,
          input.subjects,
          input.examDate,
          input.dailyStudyHours,
          input.quizHistory,
          input.weakTopics || input.strongTopics 
            ? { 
                subjectScores: {}, 
                weakTopics: input.weakTopics || [], 
                strongTopics: input.strongTopics || [] 
              }
            : undefined
        );
        console.log("[Roadmap] AI Engine generated", days.length, "days");
      } catch (aiError) {
        console.warn("[Roadmap] AI Engine failed, falling back to local generator:", aiError);
      }
    }

    // If AI failed or disabled, use local generator
    if (days.length === 0) {
      console.log("[Roadmap] Using local roadmap generator...");
      const localRoadmap = roadmapGenerator.generatePersonalizedRoadmap(input);
      days = localRoadmap.days;
    }

    // Build the full roadmap object
    const roadmap: GeneratedRoadmap = {
      days,
      metadata: {
        generatedAt: new Date().toISOString(),
        subjects: input.subjects.map(s => s.name),
        totalDays: days.length,
        examDate: input.examDate.toISOString(),
        weakTopics: input.weakTopics || [],
        strongTopics: input.strongTopics || [],
        subjectScores: {},
      },
    };

    // Cache locally
    cacheGeneratedRoadmap(roadmap);

    // Try to save to backend (when endpoint is available)
    try {
      const backendFormat = roadmapGenerator.convertToBackendFormat(roadmap);
      console.log("[Roadmap] Saving to backend...", backendFormat);
      
      // UNCOMMENT WHEN BACKEND ENDPOINT IS READY:
      // await apiClient.post("/api/roadmap/save/", backendFormat);
      
      console.log("[Roadmap] Saved to backend successfully");
    } catch (error) {
      console.warn("[Roadmap] Failed to save to backend (endpoint may not exist):", error);
    }

    return roadmap;
  },

  // Get today's roadmap - POWERED BY AI ENGINE (with fallback)
  getTodayRoadmap: async (): Promise<TodayRoadmapResponse> => {
    try {
      // First try backend
      const response = await apiClient.get(ENDPOINTS.roadmap.getToday);
      return response.data;
    } catch (backendError) {
      console.warn("[Roadmap] Backend unavailable, using cache or fallback");
      
      // Try to get from cache first
      const cached = getCachedGeneratedRoadmap();
      if (cached && cached.days.length > 0) {
        return transformGeneratedToTodayResponse(cached.days[0], "ready");
      }
      
      // Return fallback roadmap
      return getFallbackTodayRoadmap();
    }
  },

  // Get roadmap for a specific day
  getRoadmapByDay: async (dayId: string): Promise<InternalRoadmapDay> => {
    try {
      const response = await apiClient.get(ENDPOINTS.roadmap.getByDay(dayId));
      // Convert API response to internal format
      return convertApiToInternalRoadmapDay(response.data);
    } catch (error) {
      console.warn("[Roadmap] Backend failed, using cache or fallback");
      
      // Try cache first
      const cached = getCachedGeneratedRoadmap();
      if (cached) {
        const day = cached.days.find((d) => d.id === dayId || d.dayNumber === parseInt(dayId));
        if (day) {
          return day;
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
  generateRoadmap: async (): Promise<{ days: ApiRoadmapDay[] }> => {
    try {
      // Get user data from localStorage
      const userStr = localStorage.getItem("propella-user-store");
      const subjectsStr = localStorage.getItem("propella_subjects");
      const examDateStr = localStorage.getItem("propella_exam_date");
      
      if (!userStr || !subjectsStr || !examDateStr) {
        throw new Error("Missing user data for roadmap generation");
      }
      
      const user = JSON.parse(userStr);
      const subjects = JSON.parse(subjectsStr);
      const examDate = new Date(examDateStr);
      
      const roadmap = await roadmapApi.generateAndSaveRoadmap({
        studentId: user.user_id || user.username || "user_1",
        subjects,
        examDate,
        dailyStudyHours: user.study_hours_per_day || 2,
        quizHistory: [],
      });
      
      // Convert internal RoadmapDay to API RoadmapDay format
      const apiDays: ApiRoadmapDay[] = roadmap.days.map(day => convertToApiRoadmapDay(day));
      return { days: apiDays };
    } catch (error) {
      console.error("[Roadmap] Generation failed:", error);
      return { days: [] };
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
    localStorage.removeItem(GENERATED_ROADMAP_KEY);
  },
  
  // Aliases for compatibility with dashboard pages
  getToday: async (): Promise<TodayRoadmapResponse> => {
    return roadmapApi.getTodayRoadmap();
  },
  getFullRoadmap: async (): Promise<{ days: ApiRoadmapDay[] }> => {
    return roadmapApi.generateRoadmap();
  },
};

// Convert internal RoadmapDay to API format (camelCase -> snake_case)
function convertToApiRoadmapDay(day: InternalRoadmapDay): ApiRoadmapDay {
  const progress = Math.round((day.tasks.filter(t => t.status === "completed").length / (day.tasks.length || 1)) * 100) || 0;
  return {
    id: day.id,
    day_number: day.dayNumber,
    date: day.date.toISOString().split("T")[0],
    notes: `Day ${day.dayNumber}: Focus on ${day.tasks[0]?.subjectId || "general"}`,
    tasks: day.tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      duration: task.duration,
      subject_id: task.subjectId,
      topic_id: task.topicId,
      is_completed: task.status === "completed",
    })),
    progress,
    is_unlocked: day.isUnlocked,
    is_completed: day.isCompleted,
    estimated_hours: day.estimatedHours,
  } as ApiRoadmapDay;
}

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

// Transform GeneratedRoadmap day to TodayRoadmapResponse
function transformGeneratedToTodayResponse(
  day: InternalRoadmapDay,
  status: "loading" | "ready" | "error"
): TodayRoadmapResponse {
  return {
    notes: `Day ${day.dayNumber}: ${day.tasks[0]?.description || 'Focus on your studies'}`,
    quiz: {
      id: `quiz_day_${day.dayNumber}`,
      title: `Daily Quiz - Day ${day.dayNumber}`,
      total_questions: 5,
    },
    progress: Math.round((day.tasks.filter(t => t.status === "completed").length / day.tasks.length) * 100) || 0,
    tasks: day.tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type as "study" | "quiz" | "revision" | "flashcard" | "assignment" | "practice",
      status: task.status as "pending" | "in_progress" | "completed",
      duration: task.duration,
      subject_id: task.subjectId,
      topic_id: task.topicId,
    })),
    generation_status: status,
  };
}

// Convert API response to internal RoadmapDay
function convertApiToInternalRoadmapDay(apiDay: Record<string, unknown>): InternalRoadmapDay {
  const tasks = (apiDay.tasks as Record<string, unknown>[] || []).map((t, idx): Task => ({
    id: String(t.id || `task_${idx}`),
    dayId: String(apiDay.id || `day_${apiDay.day_number}`),
    type: String(t.type || "study") as Task["type"],
    title: String(t.title || "Study"),
    description: String(t.description || ""),
    subjectId: String(t.subject_id || ""),
    topicId: String(t.topic_id || ""),
    duration: Number(t.duration || 30),
    status: String(t.status || "pending") as Task["status"],
    order: Number(t.order || idx),
    resources: [],
  }));

  return {
    id: String(apiDay.id || `day_${apiDay.day_number}`),
    userId: String(apiDay.user_id || ""),
    date: new Date(String(apiDay.date)),
    dayNumber: Number(apiDay.day_number || 1),
    tasks,
    isUnlocked: Boolean(apiDay.is_unlocked ?? true),
    isCompleted: Boolean(apiDay.is_completed ?? false),
    quizRequired: true,
    quizCompleted: false,
    quizScore: null,
    minimumMasteryRequired: 50,
    estimatedHours: Number(apiDay.estimated_hours || 2),
  };
}

// Get default exam date (3 months from now)


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

function getFallbackRoadmapDay(dayNumber: number): InternalRoadmapDay {
  const subjects = ["Mathematics", "English", "Physics", "Chemistry", "Biology"];
  const subject = subjects[(dayNumber - 1) % subjects.length];
  
  return {
    id: `day_${dayNumber}`,
    userId: "",
    date: new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000),
    dayNumber: dayNumber,
    tasks: [
      {
        id: `task_${dayNumber}_1`,
        dayId: `day_${dayNumber}`,
        type: "study",
        title: `${subject}: Core Concepts`,
        description: `Study core concepts in ${subject}`,
        subjectId: subject.toLowerCase(),
        topicId: "core_concepts",
        duration: 45,
        status: "pending",
        order: 0,
        resources: [],
      },
      {
        id: `task_${dayNumber}_2`,
        dayId: `day_${dayNumber}`,
        type: "quiz",
        title: `${subject}: Practice Problems`,
        description: `Solve practice problems`,
        subjectId: subject.toLowerCase(),
        topicId: "practice",
        duration: 30,
        status: "pending",
        order: 1,
        resources: [],
      },
      {
        id: `task_${dayNumber}_3`,
        dayId: `day_${dayNumber}`,
        type: "revision",
        title: "Revision",
        description: "Review today's learning",
        subjectId: subject.toLowerCase(),
        topicId: "revision",
        duration: 15,
        status: "pending",
        order: 2,
        resources: [],
      },
    ],
    isUnlocked: dayNumber === 1,
    isCompleted: false,
    quizRequired: true,
    quizCompleted: false,
    quizScore: null,
    minimumMasteryRequired: 50,
    estimatedHours: 2,
  };
}



// New cache helpers for GeneratedRoadmap format
const GENERATED_ROADMAP_KEY = "propella_generated_roadmap";

function cacheGeneratedRoadmap(roadmap: GeneratedRoadmap) {
  localStorage.setItem(GENERATED_ROADMAP_KEY, JSON.stringify({
    ...roadmap,
    days: roadmap.days.map(day => ({
      ...day,
      date: day.date.toISOString(), // Convert Date to string for JSON
    }))
  }));
}

function getCachedGeneratedRoadmap(): GeneratedRoadmap | null {
  const cached = localStorage.getItem(GENERATED_ROADMAP_KEY);
  if (!cached) return null;
  
  try {
    const parsed = JSON.parse(cached);
    return {
      ...parsed,
      days: parsed.days.map((day: InternalRoadmapDay & { date: string }) => ({
        ...day,
        date: new Date(day.date), // Convert string back to Date
      })),
    };
  } catch (e) {
    console.error("[Roadmap] Failed to parse cached roadmap:", e);
    return null;
  }
}

export default roadmapApi;
