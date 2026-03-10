import { aiEngineApi } from "@/api/ai-engine.api";
import type { Subject, RoadmapDay, Task } from "@/types";
import { FEATURES } from "@/config/env";

// Extended response types for AI Engine
interface StudyPlanSession {
  day: number;
  topic: string;
  duration: number;
  activities: string[];
}

interface StudyPlanResponseExtended {
  sessions: StudyPlanSession[];
}

interface StudyRecommendation {
  topic: string;
  priority: "high" | "medium" | "low";
  suggested_resources: string[];
}

interface StudyRecommendationResponseExtended {
  recommendations: StudyRecommendation[];
  estimated_time_to_improvement: number;
}

// Generate AI-powered study roadmap
export async function generateAIRoadmap(
  studentId: string,
  subjects: Subject[],
  examDate: Date,
  dailyStudyHours: number,
  diagnosticResults?: {
    subjectScores: Record<string, number>;
    weakTopics: string[];
    strongTopics: string[];
  }
): Promise<RoadmapDay[]> {
  if (!FEATURES.ENABLE_AI_ENGINE) {
    throw new Error("AI Engine is disabled");
  }

  try {
    // Build quiz results from diagnostic if available
    const quizResult = diagnosticResults ? 
      subjects.map(s => ({
        subject: s.name,
        question: `Diagnostic assessment for ${s.name}`,
        options: ["A", "B", "C", "D"],
        correct_answer: "A",
        allocated_time: 60,
      })) : undefined;

    // Call AI Engine to generate roadmap
    const response = await aiEngineApi.generateRoadmap({
      subjects: subjects.map((s) => s.name),
      exam_date: examDate.toISOString().split("T")[0],
      goal: `Prepare for JAMB exam with ${dailyStudyHours} hours daily study`,
      quiz_result: quizResult,
    });

    // Convert AI phases to roadmap days
    const roadmapDays: RoadmapDay[] = [];
    const today = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalPhases = response.phases.length || 1;
    const daysPerPhase = Math.max(1, Math.floor(daysUntilExam / totalPhases));

    response.phases.forEach((phase, phaseIndex) => {
      const dayNumber = phaseIndex + 1;
      const tasks: Task[] = [{
        id: `task_${dayNumber}_1`,
        dayId: `day_${dayNumber}`,
        type: "study",
        title: phase.title,
        description: phase.description,
        subjectId: subjects[0]?.id || "general",
        topicId: "",
        duration: dailyStudyHours * 60,
        status: "pending",
        order: 0,
        resources: [],
      }];

      roadmapDays.push({
        id: `day_${dayNumber}`,
        userId: studentId,
        date: new Date(today.getTime() + phaseIndex * daysPerPhase * 24 * 60 * 60 * 1000),
        dayNumber: dayNumber,
        tasks,
        isUnlocked: dayNumber === 1,
        isCompleted: false,
        quizRequired: true,
        quizCompleted: false,
        quizScore: null,
        minimumMasteryRequired: 50,
        estimatedHours: dailyStudyHours,
      });
    });

    return roadmapDays;
  } catch (error) {
    console.error("Failed to generate AI roadmap:", error);
    throw error;
  }
}

// Generate subject-specific study plan
export async function generateAIStudyPlan(
  studentId: string,
  subject: Subject,
  availableHours: number,
  deadline: string
): Promise<Task[]> {
  if (!FEATURES.ENABLE_AI_ENGINE) {
    throw new Error("AI Engine is disabled");
  }

  try {
    const response = await aiEngineApi.generateStudyPlan({
      student_id: studentId,
      subjects: [subject.name],
      exam_date: deadline,
      daily_study_hours: availableHours,
    }) as unknown as StudyPlanResponseExtended;

    // Convert sessions to tasks
    const tasks: Task[] = [];

    response.sessions.forEach((session: StudyPlanSession, sessionIndex: number) => {
      session.activities.forEach((activity: string, activityIndex: number) => {
        tasks.push({
          id: `task_${session.day}_${sessionIndex}_${activityIndex}`,
          dayId: `day_${session.day}`,
          type: activityIndex % 2 === 0 ? "study" : "quiz",
          title: `${session.topic}: ${activity}`,
          description: `Focus on ${session.topic}`,
          subjectId: subject.id,
          topicId: subject.topics.find((t) => t.name === session.topic)?.id || "",
          duration: Math.floor(session.duration / session.activities.length),
          status: "pending",
          order: activityIndex,
          resources: [],
        });
      });
    });

    return tasks;
  } catch (error) {
    console.error("Failed to generate AI study plan:", error);
    throw error;
  }
}

// Get study recommendation for a subject
export async function getAIStudyRecommendation(
  studentId: string,
  subject: Subject
): Promise<{
  priorityTopics: string[];
  suggestedResources: string[];
  estimatedTimeToMastery: number;
}> {
  if (!FEATURES.ENABLE_AI_ENGINE) {
    throw new Error("AI Engine is disabled");
  }

  try {
    const response = await aiEngineApi.getStudyRecommendation(
      studentId,
      subject.name
    ) as unknown as StudyRecommendationResponseExtended;

    // Extract priority topics from recommendations
    const priorityTopics = response.recommendations
      .filter((r: StudyRecommendation) => r.priority === "high")
      .map((r: StudyRecommendation) => r.topic);
    
    // Collect all suggested resources
    const suggestedResources = response.recommendations
      .flatMap((r: StudyRecommendation) => r.suggested_resources);

    return {
      priorityTopics,
      suggestedResources: [...new Set(suggestedResources)] as string[],
      estimatedTimeToMastery: response.estimated_time_to_improvement,
    };
  } catch (error) {
    console.error("Failed to get AI study recommendation:", error);
    throw error;
  }
}

// Update student progress
export async function updateAIProgress(
  studentId: string,
  subject: string,
  topic: string,
  masteryScore: number
): Promise<void> {
  if (!FEATURES.ENABLE_AI_ENGINE) {
    return; // Silently skip if AI Engine is disabled
  }

  try {
    // Validate inputs before sending
    if (!studentId || !subject || !topic || masteryScore === undefined) {
      console.warn("[AI Progress] Invalid progress data:", { studentId, subject, topic, masteryScore });
      return;
    }

    // Convert numeric ID to string if needed, or use username format
    // The AI Engine expects student_id as a string identifier
    const normalizedStudentId = String(studentId).trim();
    const normalizedSubject = String(subject).trim();
    const normalizedTopic = String(topic).trim();
    const normalizedScore = Math.max(0, Math.min(100, Math.round(masteryScore))); // Clamp 0-100

    console.log("[AI Progress] Updating progress:", {
      student_id: normalizedStudentId,
      subject: normalizedSubject,
      topic: normalizedTopic,
      mastery_score: normalizedScore,
    });

    await aiEngineApi.updateProgress({
      student_id: normalizedStudentId,
      subject: normalizedSubject,
      topic: normalizedTopic,
      mastery_score: normalizedScore,
    });
    
    console.log("[AI Progress] Update successful");
  } catch (error) {
    // Log detailed error but don't throw - progress update failure shouldn't break the app
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    if (axiosError.response?.status === 422) {
      console.warn("[AI Progress] Validation error (422):", axiosError.response?.data);
    } else if (axiosError.response?.status === 500) {
      console.warn("[AI Progress] Server error (500) - student may not be registered in AI Engine");
    } else {
      console.error("[AI Progress] Failed to update:", error);
    }
  }
}

export const aiRoadmapService = {
  generateAIRoadmap,
  generateAIStudyPlan,
  getAIStudyRecommendation,
  updateAIProgress,
};

export default aiRoadmapService;
