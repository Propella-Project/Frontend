// Roadmap Generator Service
// Generates personalized study roadmaps based on quiz results, subjects, and exam date
// Can work completely offline (no AI Engine needed)

import type { Subject, RoadmapDay, Task, Quiz } from "@/types";

export interface RoadmapInput {
  studentId: string;
  subjects: Subject[];
  examDate: Date;
  dailyStudyHours: number;
  quizHistory: Quiz[];
  weakTopics?: string[];
  strongTopics?: string[];
}

export interface GeneratedRoadmap {
  days: RoadmapDay[];
  metadata: {
    generatedAt: string;
    subjects: string[];
    totalDays: number;
    examDate: string;
    weakTopics: string[];
    strongTopics: string[];
    subjectScores: Record<string, number>;
  };
}

// Calculate subject performance from quiz history
function calculateSubjectPerformance(quizHistory: Quiz[]): {
  subjectScores: Record<string, number>;
  topicPerformance: Record<string, number>;
  weakTopics: string[];
  strongTopics: string[];
} {
  const subjectData: Record<string, { totalScore: number; count: number }> = {};
  const topicData: Record<string, { totalScore: number; count: number }> = {};

  quizHistory.forEach((quiz) => {
    if (!quiz.completed) return;

    // Aggregate by subject
    if (!subjectData[quiz.subjectId]) {
      subjectData[quiz.subjectId] = { totalScore: 0, count: 0 };
    }
    subjectData[quiz.subjectId].totalScore += quiz.score;
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

  return { subjectScores, topicPerformance, weakTopics, strongTopics };
}

// Generate daily tasks based on subject and performance
function generateDailyTasks(
  dayNumber: number,
  subject: Subject,
  weakTopics: string[],
  dailyStudyHours: number
): Task[] {
  const tasks: Task[] = [];
  const studyMinutes = dailyStudyHours * 60;

  // Find weak topics for this subject
  const subjectWeakTopics = subject.topics.filter((t) =>
    weakTopics.some((wt) => t.name.toLowerCase().includes(wt.toLowerCase()))
  );

  // Prioritize weak topics
  if (subjectWeakTopics.length > 0 && dayNumber % 3 !== 0) {
    // Every 2 out of 3 days, focus on weak areas
    const focusTopic = subjectWeakTopics[dayNumber % subjectWeakTopics.length];
    tasks.push({
      id: `task_${dayNumber}_weak`,
      dayId: `day_${dayNumber}`,
      type: "study",
      title: `Strengthen: ${focusTopic.name}`,
      description: `Focus on ${focusTopic.name} - identified as an area needing improvement`,
      subjectId: subject.id,
      topicId: focusTopic.id,
      duration: Math.round(studyMinutes * 0.5),
      status: "pending",
      order: 0,
      resources: [],
    });
  }

  // Add regular study task
  const regularTopic = subject.topics[dayNumber % subject.topics.length];
  tasks.push({
    id: `task_${dayNumber}_study`,
    dayId: `day_${dayNumber}`,
    type: "study",
    title: `Study: ${regularTopic.name}`,
    description: `Learn about ${regularTopic.name} in ${subject.name}`,
    subjectId: subject.id,
    topicId: regularTopic.id,
    duration: Math.round(studyMinutes * (tasks.length > 0 ? 0.3 : 0.6)),
    status: "pending",
    order: tasks.length,
    resources: [],
  });

  // Add practice quiz
  tasks.push({
    id: `task_${dayNumber}_quiz`,
    dayId: `day_${dayNumber}`,
    type: "quiz",
    title: `Practice Quiz - ${subject.name}`,
    description: `Test your knowledge with practice questions`,
    subjectId: subject.id,
    topicId: regularTopic.id,
    duration: 20,
    status: "pending",
    order: tasks.length,
    resources: [],
  });

  // Add revision task for days > 1
  if (dayNumber > 1) {
    tasks.push({
      id: `task_${dayNumber}_revision`,
      dayId: `day_${dayNumber}`,
      type: "revision",
      title: "Quick Revision",
      description: "Review previous topics",
      subjectId: subject.id,
      topicId: "",
      duration: 15,
      status: "pending",
      order: tasks.length,
      resources: [],
    });
  }

  return tasks;
}

// Main roadmap generation function
export function generatePersonalizedRoadmap(input: RoadmapInput): GeneratedRoadmap {
  const { studentId, subjects, examDate, dailyStudyHours, quizHistory } = input;

  // Calculate performance data
  const performance = calculateSubjectPerformance(quizHistory);

  // Use provided weak/strong topics or calculated ones
  const weakTopics = input.weakTopics?.length
    ? input.weakTopics
    : performance.weakTopics;
  const strongTopics = input.strongTopics?.length
    ? input.strongTopics
    : performance.strongTopics;

  // Calculate study plan duration
  const today = new Date();
  const daysUntilExam = Math.max(
    7,
    Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Prioritize subjects: weak subjects first
  const prioritizedSubjects = [...subjects].sort((a, b) => {
    const aScore = performance.subjectScores[a.id] || 50;
    const bScore = performance.subjectScores[b.id] || 50;
    return aScore - bScore; // Lower scores first (weaker subjects)
  });

  // Generate roadmap days
  const days: RoadmapDay[] = [];
  const leaveBufferDays = 3; // Last 3 days for final revision
  const actualStudyDays = Math.max(7, daysUntilExam - leaveBufferDays);

  for (let i = 0; i < actualStudyDays; i++) {
    const dayNumber = i + 1;
    const subject = prioritizedSubjects[i % prioritizedSubjects.length];
    const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);

    const tasks = generateDailyTasks(dayNumber, subject, weakTopics, dailyStudyHours);

    // Calculate estimated hours from tasks
    const estimatedHours = tasks.reduce((sum, t) => sum + t.duration, 0) / 60;

    days.push({
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
      estimatedHours: Math.round(estimatedHours * 10) / 10,
    });
  }

  return {
    days,
    metadata: {
      generatedAt: new Date().toISOString(),
      subjects: subjects.map((s) => s.name),
      totalDays: days.length,
      examDate: examDate.toISOString(),
      weakTopics,
      strongTopics,
      subjectScores: performance.subjectScores,
    },
  };
}

// Convert generated roadmap to backend format
export function convertToBackendFormat(roadmap: GeneratedRoadmap): {
  days: Array<{
    day_number: number;
    date: string;
    notes: string;
    tasks: Array<{
      title: string;
      description: string;
      type: string;
      duration_minutes: number;
      subject_id: string;
      topic_id: string;
    }>;
    is_unlocked: boolean;
    is_completed: boolean;
  }>;
} {
  return {
    days: roadmap.days.map((day) => ({
      day_number: day.dayNumber,
      date: day.date.toISOString().split("T")[0],
      notes: `Day ${day.dayNumber}: Focus on ${day.tasks[0]?.subjectId || "general"}`,
      tasks: day.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        type: task.type,
        duration_minutes: task.duration,
        subject_id: task.subjectId,
        topic_id: task.topicId,
      })),
      is_unlocked: day.isUnlocked,
      is_completed: day.isCompleted,
    })),
  };
}

export const roadmapGenerator = {
  generatePersonalizedRoadmap,
  convertToBackendFormat,
};

export default roadmapGenerator;
