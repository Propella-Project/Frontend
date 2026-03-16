import { aiEngineApi } from "@/api/ai-engine.api";
import type { Subject, RoadmapDay, Task, Quiz } from "@/types";
import { FEATURES } from "@/config/env";
import { roadmapGenerator } from "./roadmapGenerator.service";

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

// Calculate subject performance from quiz history
function calculateSubjectPerformance(quizHistory: Quiz[]): {
  subjectScores: Record<string, number>;
  topicPerformance: Record<string, number>;
  weakTopics: string[];
  strongTopics: string[];
  averageTimePerQuestion: number;
} {
  const subjectData: Record<string, { totalScore: number; totalTime: number; count: number }> = {};
  const topicData: Record<string, { totalScore: number; count: number }> = {};
  let totalQuestions = 0;
  let totalTimeMs = 0;

  quizHistory.forEach((quiz) => {
    if (!quiz.completed) return;

    totalQuestions += quiz.totalQuestions;
    totalTimeMs += quiz.timeTaken;

    // Aggregate by subject
    if (!subjectData[quiz.subjectId]) {
      subjectData[quiz.subjectId] = { totalScore: 0, totalTime: 0, count: 0 };
    }
    subjectData[quiz.subjectId].totalScore += quiz.score;
    subjectData[quiz.subjectId].totalTime += quiz.timeTaken;
    subjectData[quiz.subjectId].count += 1;

    // Aggregate by topic from individual questions
    quiz.questions.forEach((q, idx) => {
      const isCorrect = quiz.answers[idx] === q.correctAnswer;
      const score = isCorrect ? 100 : 0;

      if (!topicData[q.topic]) {
        topicData[q.topic] = { totalScore: 0, count: 0 };
      }
      topicData[q.topic].totalScore += score;
      topicData[q.topic].count += 1;
    });
  });

  // Calculate averages
  const subjectScores: Record<string, number> = {};
  Object.entries(subjectData).forEach(([subjectId, data]) => {
    subjectScores[subjectId] = Math.round(data.totalScore / data.count);
  });

  const topicPerformance: Record<string, number> = {};
  const weakTopics: string[] = [];
  const strongTopics: string[] = [];

  Object.entries(topicData).forEach(([topic, data]) => {
    const avg = Math.round(data.totalScore / data.count);
    topicPerformance[topic] = avg;

    if (avg < 50) weakTopics.push(topic);
    else if (avg >= 80) strongTopics.push(topic);
  });

  const averageTimePerQuestion = totalQuestions > 0 
    ? Math.round(totalTimeMs / totalQuestions / 1000) // in seconds
    : 60;

  return { subjectScores, topicPerformance, weakTopics, strongTopics, averageTimePerQuestion };
}

// Convert quiz history to AI Engine format
function buildQuizResultForAI(
  subjects: Subject[],
  quizHistory: Quiz[],
  subjectScores: Record<string, number>
): Array<{
  subject: string;
  question: string;
  options: string[];
  correct_answer: string;
  allocated_time: number;
}> {
  return subjects.map((subject) => {
    const score = subjectScores[subject.id] || 50;
    const subjectQuizzes = quizHistory.filter(q => q.subjectId === subject.id);
    const avgTime = subjectQuizzes.length > 0
      ? Math.round(subjectQuizzes.reduce((sum, q) => sum + q.timeTaken, 0) / subjectQuizzes.length / 1000)
      : 60;
    
    // Find weak topics for this subject
    const weakTopicsForSubject = subjectQuizzes.flatMap(q => 
      q.questions.filter((ques, idx) => {
        const isCorrect = q.answers[idx] === ques.correctAnswer;
        return !isCorrect;
      }).map(q => q.topic)
    );
    
    const uniqueWeakTopics = [...new Set(weakTopicsForSubject)].slice(0, 3);
    
    return {
      subject: subject.name,
      question: `Diagnostic for ${subject.name}: Weak areas: ${uniqueWeakTopics.join(', ') || 'None identified'}. Score: ${score}%`,
      options: ["A", "B", "C", "D"],
      correct_answer: score >= 50 ? "A" : "B",
      allocated_time: avgTime,
    };
  });
}

// Generate AI-powered study roadmap
export async function generateAIRoadmap(
  studentId: string,
  subjects: Subject[],
  examDate: Date,
  dailyStudyHours: number,
  quizHistory: Quiz[] = [],
  diagnosticResults?: {
    subjectScores: Record<string, number>;
    weakTopics: string[];
    strongTopics: string[];
  }
): Promise<RoadmapDay[]> {
  
  // Calculate performance data from quiz history
  const performance = calculateSubjectPerformance(quizHistory);
  
  // Merge with diagnostic results if available
  const finalSubjectScores = { ...performance.subjectScores, ...diagnosticResults?.subjectScores };
  const finalWeakTopics = diagnosticResults?.weakTopics?.length 
    ? diagnosticResults.weakTopics 
    : performance.weakTopics;
  const finalStrongTopics = diagnosticResults?.strongTopics?.length
    ? diagnosticResults.strongTopics
    : performance.strongTopics;

  // Try AI Engine first if enabled
  if (FEATURES.ENABLE_AI_ENGINE) {
    try {
      // Build quiz results for AI
      const quizResult = buildQuizResultForAI(subjects, quizHistory, finalSubjectScores);
      
      // Call AI Engine
      const response = await aiEngineApi.generateRoadmap({
        subjects: subjects.map(s => s.name),
        exam_date: examDate.toISOString().split("T")[0],
        goal: `JAMB exam preparation. Daily study: ${dailyStudyHours} hours. Student performance: ${JSON.stringify(finalSubjectScores)}. Focus areas: ${finalWeakTopics.join(', ')}`,
        quiz_result: quizResult.length > 0 ? quizResult : undefined,
      });

      // Convert AI phases to roadmap days
      const roadmapDays = convertAIPhasesToRoadmapDays(
        response.phases,
        studentId,
        subjects,
        examDate,
        dailyStudyHours,
        finalWeakTopics,
        finalSubjectScores
      );

      return roadmapDays;
    } catch {
      // Continue to local fallback
    }
  }

  // Fallback to local generation
  const localRoadmap = roadmapGenerator.generatePersonalizedRoadmap({
    studentId,
    subjects,
    examDate,
    dailyStudyHours,
    quizHistory,
    weakTopics: finalWeakTopics,
    strongTopics: finalStrongTopics,
  });
  return localRoadmap.days;
}

// Convert AI Engine phases to RoadmapDays
function convertAIPhasesToRoadmapDays(
  phases: Array<{ order: number; title: string; description: string }>,
  studentId: string,
  subjects: Subject[],
  examDate: Date,
  dailyStudyHours: number,
  weakTopics: string[],
  subjectScores: Record<string, number>
): RoadmapDay[] {
  
  const today = new Date();
  const daysUntilExam = Math.max(7, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const leaveBufferDays = 3;
  const actualStudyDays = Math.min(phases.length, daysUntilExam - leaveBufferDays);
  
  // Sort subjects by weakness (weaker first)
  const prioritizedSubjects = [...subjects].sort((a, b) => {
    const aScore = subjectScores[a.id] || 50;
    const bScore = subjectScores[b.id] || 50;
    return aScore - bScore;
  });

  return phases.slice(0, actualStudyDays).map((phase, index) => {
    const dayNumber = index + 1;
    const date = new Date(today.getTime() + index * 24 * 60 * 60 * 1000);
    const subject = prioritizedSubjects[index % prioritizedSubjects.length];
    
    // Find weak topics for this subject
    const subjectWeakTopics = subject.topics.filter(t => 
      weakTopics.some(wt => t.name.toLowerCase().includes(wt.toLowerCase()))
    );
    
    const tasks: Task[] = [];
    const studyMinutes = dailyStudyHours * 60;

    // Task 1: AI-generated focus (or weak topic)
    tasks.push({
      id: `task_${dayNumber}_1`,
      dayId: `day_${dayNumber}`,
      type: "study",
      title: phase.title,
      description: phase.description,
      subjectId: subject.id,
      topicId: subjectWeakTopics[0]?.id || subject.topics[0]?.id || "",
      duration: Math.round(studyMinutes * 0.5),
      status: "pending",
      order: 0,
      resources: [],
    });

    // Task 2: Additional study on weak topic if exists
    if (subjectWeakTopics.length > 1) {
      tasks.push({
        id: `task_${dayNumber}_2`,
        dayId: `day_${dayNumber}`,
        type: "study",
        title: `Focus: ${subjectWeakTopics[1].name}`,
        description: `Additional practice on ${subjectWeakTopics[1].name}`,
        subjectId: subject.id,
        topicId: subjectWeakTopics[1].id,
        duration: Math.round(studyMinutes * 0.25),
        status: "pending",
        order: 1,
        resources: [],
      });
    }

    // Task 3: Practice quiz
    tasks.push({
      id: `task_${dayNumber}_quiz`,
      dayId: `day_${dayNumber}`,
      type: "quiz",
      title: `Practice Quiz - ${subject.name}`,
      description: "Test your knowledge",
      subjectId: subject.id,
      topicId: "",
      duration: 20,
      status: "pending",
      order: tasks.length,
      resources: [],
    });

    // Task 4: Revision (for days > 1)
    if (dayNumber > 1) {
      tasks.push({
        id: `task_${dayNumber}_revision`,
        dayId: `day_${dayNumber}`,
        type: "revision",
        title: "Revision",
        description: "Review previous topics",
        subjectId: subject.id,
        topicId: "",
        duration: 15,
        status: "pending",
        order: tasks.length,
        resources: [],
      });
    }

    return {
      id: `day_${dayNumber}`,
      userId: studentId,
      date,
      dayNumber,
      tasks,
      isUnlocked: dayNumber === 1,
      isCompleted: false,
      quizRequired: true,
      quizCompleted: false,
      quizScore: null,
      minimumMasteryRequired: 50,
      estimatedHours: dailyStudyHours,
    };
  });
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
      return;
    }

    // Convert numeric ID to string if needed, or use username format
    // The AI Engine expects student_id as a string identifier
    const normalizedStudentId = String(studentId).trim();
    const normalizedSubject = String(subject).trim();
    const normalizedTopic = String(topic).trim();
    const normalizedScore = Math.max(0, Math.min(100, Math.round(masteryScore))); // Clamp 0-100

    await aiEngineApi.updateProgress({
      student_id: normalizedStudentId,
      subject: normalizedSubject,
      topic: normalizedTopic,
      mastery_score: normalizedScore,
    });
  } catch {
    // Progress update failure shouldn't break the app
  }
}

export const aiRoadmapService = {
  generateAIRoadmap,
  generateAIStudyPlan,
  getAIStudyRecommendation,
  updateAIProgress,
};

export default aiRoadmapService;
