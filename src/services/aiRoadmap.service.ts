import { aiEngineApi } from "@/api/ai-engine.api";
import type { Subject, RoadmapDay, Task } from "@/types";
import { FEATURES } from "@/config/env";

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
      subject: subject.name,
      weak_topics: subject.topics.slice(0, 3).map((t) => t.name),
      available_hours: availableHours,
      deadline,
    });

    // Convert sessions to tasks
    const tasks: Task[] = [];

    response.sessions.forEach((session, sessionIndex) => {
      session.activities.forEach((activity, activityIndex) => {
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
    );

    // Extract priority topics from recommendations
    const priorityTopics = response.recommendations
      .filter(r => r.priority === "high")
      .map(r => r.topic);
    
    // Collect all suggested resources
    const suggestedResources = response.recommendations
      .flatMap(r => r.suggested_resources);

    return {
      priorityTopics,
      suggestedResources: [...new Set(suggestedResources)],
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
    await aiEngineApi.updateProgress({
      student_id: studentId,
      subject,
      topic,
      mastery_score: Math.round(masteryScore), // 0-100
    });
  } catch (error) {
    console.error("Failed to update AI progress:", error);
    // Don't throw - progress update failure shouldn't break the app
  }
}

export const aiRoadmapService = {
  generateAIRoadmap,
  generateAIStudyPlan,
  getAIStudyRecommendation,
  updateAIProgress,
};

export default aiRoadmapService;
