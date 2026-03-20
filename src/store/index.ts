import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  Subject,
  Question,
  Quiz,
  RoadmapDay,
  Task,
  Assignment,
  ChatMessage,
  Flashcard,
  AbilityLevel,
  GamificationStats,
  Badge,
} from "@/types";
import { JAMB_SUBJECTS, BADGES, RANKS } from "@/types";
import { FEATURES } from "@/config/env";
import aiQuizService from "@/services/aiQuiz.service";
import aiRoadmapService from "@/services/aiRoadmap.service";
import { roadmapApi } from "@/api/roadmap.api";
// import aiTutorService from "@/services/aiTutor.service"; // Available for future use

interface AppState {
  // User Data
  user: User | null;
  isOnboardingComplete: boolean;

  // Subjects and Topics
  subjects: Subject[];
  selectedSubjects: Subject[];

  // Roadmap
  roadmap: RoadmapDay[];
  currentDay: number;

  // Quiz
  currentQuiz: Quiz | null;
  quizHistory: Quiz[];

  // Diagnostic Quiz Results
  diagnosticResults: {
    subjectScores: Record<string, number>;
    topicScores: Record<string, number>;
    weakTopics: string[];
    strongTopics: string[];
    completed: boolean;
  } | null;

  // Tasks and Assignments
  tasks: Task[];
  assignments: Assignment[];

  // Chat
  chatMessages: ChatMessage[];

  // Flashcards
  flashcards: Flashcard[];

  // Gamification
  gamification: GamificationStats;
  badges: Badge[];

  // UI State
  currentPage:
    | "onboarding"
    | "dashboard"
    | "roadmap"
    | "tutor"
    | "tasks"
    | "quiz"
    | "catalog"
    | "profile";
  isLoading: boolean;
  
  // AI Generation State
  isGeneratingQuiz: boolean;
  isGeneratingRoadmap: boolean;
  generationError: string | null;

  // Onboarding Actions
  setUser: (user: Partial<User>) => void;
  setSelectedSubjects: (subjects: Subject[]) => void;
  setOnboardingComplete: (complete: boolean) => void;
  completeOnboarding: () => void;
  resumeOnboarding: () => void;
  completeDiagnosticQuiz: (results: AppState["diagnosticResults"]) => void;

  // Subject Actions
  updateTopicAbility: (topicId: string, score: number) => void;

  // Roadmap Actions
  generateRoadmap: () => Promise<void>;
  generateRoadmapWithAI: () => Promise<void>;
  unlockDay: (dayNumber: number) => void;
  completeDay: (dayNumber: number) => void;

  // Quiz Actions
  startQuiz: (
    subjectId: string,
    topicId: string | null,
    type: Quiz["type"],
    subjectIds?: string[],
  ) => Promise<void>;
  startQuizWithAI: (
    subjectId: string,
    topicId: string | null,
    type: Quiz["type"],
    subjectIds?: string[],
  ) => Promise<void>;
  answerQuestion: (questionIndex: number, answer: number) => void;
  completeQuiz: () => Promise<void>;

  // Task Actions
  addTask: (task: Task) => void;
  completeTask: (taskId: string) => void;

  // Assignment Actions
  addAssignment: (assignment: Assignment) => void;
  completeAssignment: (assignmentId: string) => void;

  // Chat Actions
  addMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // Gamification Actions
  addPoints: (points: number) => void;
  updateStreak: () => void;
  unlockBadge: (badgeId: string) => void;

  // Navigation
  setCurrentPage: (page: AppState["currentPage"]) => void;

  // Reset
  resetApp: () => void;
}

const getInitialGamification = (): GamificationStats => ({
  points: 0,
  level: 1,
  streak: 0,
  longestStreak: 0,
  totalStudyTime: 0,
  quizzesCompleted: 0,
  averageScore: 0,
  badges: [],
  rank: "Rookie",
  nextLevelPoints: 500,
});

const calculateRank = (points: number): string => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].minPoints) {
      return RANKS[i].name;
    }
  }
  return "Rookie";
};

const calculateLevel = (points: number): number => {
  return Math.floor(points / 500) + 1;
};

const getAbilityLevel = (score: number): AbilityLevel => {
  if (score < 30) return "critical";
  if (score < 50) return "weak";
  if (score < 75) return "moderate";
  return "strong";
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isOnboardingComplete: false,
      subjects: JAMB_SUBJECTS,
      selectedSubjects: [],
      roadmap: [],
      currentDay: 1,
      currentQuiz: null,
      quizHistory: [],
      diagnosticResults: null,
      tasks: [],
      assignments: [],
      chatMessages: [],
      flashcards: [],
      gamification: getInitialGamification(),
      badges: BADGES,
      currentPage: "onboarding",
      isLoading: false,
      isGeneratingQuiz: false,
      isGeneratingRoadmap: false,
      generationError: null,

      // Onboarding Actions
      setUser: (userData) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, ...userData }
            : (userData as User),
        }));
      },

      setSelectedSubjects: (subjects) => {
        set({ selectedSubjects: subjects });
      },

      setOnboardingComplete: (complete) => {
        set({
          isOnboardingComplete: complete,
          ...(complete && { currentPage: "dashboard" as const }),
        });
      },

      completeOnboarding: () => {
        const { user, selectedSubjects } = get();
        if (user && selectedSubjects.length > 0) {
          set({
            user: {
              ...user,
              subjects: selectedSubjects,
              onboardingComplete: true,
            },
            isOnboardingComplete: true,
            currentPage: "dashboard",
          });
        }
      },

      resumeOnboarding: () => {
        set({
          isOnboardingComplete: false,
          currentPage: "onboarding",
        });
      },

      // Diagnostic Quiz Actions
      completeDiagnosticQuiz: (results) => {
        set({ diagnosticResults: results });

        // Update topic abilities based on diagnostic results
        const { topicScores } = results || {};
        if (topicScores) {
          Object.entries(topicScores).forEach(([topicId, score]) => {
            get().updateTopicAbility(topicId, score as number);
          });
        }
      },

      // Subject Actions
      updateTopicAbility: (topicId, score) => {
        set((state) => ({
          subjects: state.subjects.map((subject) => ({
            ...subject,
            topics: subject.topics.map((topic) =>
              topic.id === topicId
                ? {
                    ...topic,
                    abilityScore: score,
                    abilityLevel: getAbilityLevel(score),
                    questionsAttempted: topic.questionsAttempted + 1,
                    questionsCorrect:
                      score >= 50
                        ? topic.questionsCorrect + 1
                        : topic.questionsCorrect,
                    lastStudied: new Date(),
                    masteryProgress: Math.min(
                      100,
                      topic.masteryProgress + (score >= 60 ? 10 : 5),
                    ),
                  }
                : topic,
            ),
          })),
        }));
      },

      // Roadmap Actions
      generateRoadmap: async () => {
        const { user, subjects, generateRoadmapWithAI } = get();
        if (!user || !user.examDate) return;

        // Try AI-powered roadmap first
        if (FEATURES.ENABLE_AI_ENGINE) {
          try {
            await generateRoadmapWithAI();
            return;
          } catch (error) {
            console.warn("AI roadmap generation failed, using fallback:", error);
          }
        }

        // Fallback: Generate local roadmap
        const examDate = new Date(user.examDate);
        const today = new Date();
        const daysUntilExam = Math.ceil(
          (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Leave 2 weeks for revision
        const studyDays = Math.max(1, daysUntilExam - 14);

        const roadmap: RoadmapDay[] = [];
        let dayNumber = 1;

        // Get all topics from selected subjects
        const allTopics = subjects.flatMap((s) => s.topics);

        // Sort topics by ability level (weakest first)
        const sortedTopics = [...allTopics].sort(
          (a, b) => a.abilityScore - b.abilityScore,
        );

        // Calculate topics per day based on daily study hours
        const topicsPerDay = Math.max(
          1,
          Math.floor(user.dailyStudyHours * 1.5),
        );

        for (
          let i = 0;
          i < studyDays && i < sortedTopics.length;
          i += topicsPerDay
        ) {
          const dayTopics = sortedTopics.slice(i, i + topicsPerDay);

          const tasks: Task[] = dayTopics.map((topic, idx) => ({
            id: `task_${dayNumber}_${idx}`,
            dayId: `day_${dayNumber}`,
            type: "study",
            title: `Study: ${topic.name}`,
            description: `Master the fundamentals of ${topic.name}`,
            subjectId: topic.subjectId,
            topicId: topic.id,
            duration: Math.floor((user.dailyStudyHours * 60) / topicsPerDay),
            status: "pending",
            order: idx,
            resources: [],
          }));

          // Add quiz task
          tasks.push({
            id: `task_${dayNumber}_quiz`,
            dayId: `day_${dayNumber}`,
            type: "quiz",
            title: "Daily Quiz",
            description: "Test your knowledge with past questions",
            subjectId: dayTopics[0].subjectId,
            topicId: dayTopics[0].id,
            duration: 20,
            status: "pending",
            order: tasks.length,
            resources: [],
          });

          // Add revision task if not first day
          if (dayNumber > 1) {
            tasks.push({
              id: `task_${dayNumber}_revision`,
              dayId: `day_${dayNumber}`,
              type: "revision",
              title: "Quick Revision",
              description: "Review previous topics",
              subjectId: dayTopics[0].subjectId,
              topicId: dayTopics[0].id,
              duration: 15,
              status: "pending",
              order: tasks.length,
              resources: [],
            });
          }

          roadmap.push({
            id: `day_${dayNumber}`,
            userId: user.id || "user_1",
            date: new Date(today.getTime() + i * 24 * 60 * 60 * 1000),
            dayNumber,
            tasks,
            isUnlocked: dayNumber === 1,
            isCompleted: false,
            quizRequired: true,
            quizCompleted: false,
            quizScore: null,
            minimumMasteryRequired: 50,
            estimatedHours: user.dailyStudyHours,
          });

          dayNumber++;
        }

        set({ roadmap, isGeneratingRoadmap: false });
      },

      generateRoadmapWithAI: async () => {
        const { user, selectedSubjects, diagnosticResults, quizHistory } = get();
        if (!user || !user.examDate) {
          console.warn("[Store] Cannot generate roadmap: missing user or exam date");
          return;
        }

        set({ isGeneratingRoadmap: true, generationError: null });

        try {
          // Use the new local roadmap generator (no AI Engine needed)
          const generatedRoadmap = await roadmapApi.generateAndSaveRoadmap({
            studentId: user.id || "user_1",
            subjects: selectedSubjects,
            examDate: new Date(user.examDate),
            dailyStudyHours: user.dailyStudyHours,
            quizHistory: quizHistory,
            weakTopics: diagnosticResults?.weakTopics,
            strongTopics: diagnosticResults?.strongTopics,
          });

          set({ 
            roadmap: generatedRoadmap.days, 
            isGeneratingRoadmap: false 
          });
        } catch (error) {
          set({
            isGeneratingRoadmap: false,
            generationError: "Failed to generate roadmap",
          });
          throw error;
        }
      },

      unlockDay: (dayNumber) => {
        set((state) => ({
          roadmap: state.roadmap.map((day) =>
            day.dayNumber === dayNumber ? { ...day, isUnlocked: true } : day,
          ),
        }));
      },

      completeDay: (dayNumber) => {
        set((state) => ({
          roadmap: state.roadmap.map((day) =>
            day.dayNumber === dayNumber ? { ...day, isCompleted: true } : day,
          ),
        }));

        // Unlock next day if score is good enough
        const day = get().roadmap.find((d) => d.dayNumber === dayNumber);
        if (day && day.quizScore && day.quizScore >= 50) {
          get().unlockDay(dayNumber + 1);
        }

        // Update streak
        get().updateStreak();

        // Add points
        get().addPoints(100);
      },

      // Quiz Actions
      startQuiz: async (subjectId, topicId, type, subjectIds) => {
        const { startQuizWithAI } = get();

        set({ isGeneratingQuiz: true, generationError: null });

        try {
          if (FEATURES.ENABLE_AI_ENGINE) {
            await startQuizWithAI(subjectId, topicId, type, subjectIds);
            return;
          }
        } catch (error) {
          console.warn("AI quiz generation failed:", error);
        }

        set({
          isGeneratingQuiz: false,
          generationError: "Unable to generate questions. Please try again.",
        });
      },

      startQuizWithAI: async (subjectId, topicId, type, subjectIds) => {
        const { subjects } = get();

        set({ isGeneratingQuiz: true, generationError: null });

        try {
          let questions: Question[] = [];

          if (type === "diagnostic" && subjectIds && subjectIds.length > 0) {
            // Generate mixed questions for diagnostic quiz
            const selectedSubjects = subjectIds
              .map((sid) => subjects.find((s) => s.id === sid))
              .filter((s): s is Subject => s !== undefined);

            questions = await aiQuizService.generateMixedAIQuestions(
              selectedSubjects,
              3, // 3 questions per subject
              "medium",
            );
          } else {
            // Single subject quiz
            const subject = subjects.find((s) => s.id === subjectId);
            if (!subject) {
              set({ isGeneratingQuiz: false });
              return;
            }

            questions = await aiQuizService.generateAIQuestions(
              subject,
              topicId,
              type === "diagnostic" ? 5 : 10,
              "medium",
            );
          }

          const quiz: Quiz = {
            id: `quiz_${Date.now()}`,
            userId: get().user?.id || "user_1",
            subjectId: subjectIds ? subjectIds[0] : subjectId,
            topicId,
            questions,
            answers: [],
            score: 0,
            totalQuestions: questions.length,
            timeTaken: 0,
            completed: false,
            createdAt: new Date(),
            type,
          };

          set({ currentQuiz: quiz, currentPage: "quiz", isGeneratingQuiz: false });
        } catch (error) {
          console.error("AI quiz generation failed:", error);
          set({
            isGeneratingQuiz: false,
            generationError: "Failed to generate AI quiz",
          });
          throw error;
        }
      },

      answerQuestion: (questionIndex, answer) => {
        set((state) => {
          if (!state.currentQuiz) return state;

          const newAnswers = [...state.currentQuiz.answers];
          newAnswers[questionIndex] = answer;

          return {
            currentQuiz: {
              ...state.currentQuiz,
              answers: newAnswers,
            },
          };
        });
      },

      completeQuiz: async () => {
        const { currentQuiz, user, quizHistory } = get();
        if (!currentQuiz) return;

        let correct = 0;
        currentQuiz.questions.forEach((q, i) => {
          if (currentQuiz.answers[i] === q.correctAnswer) {
            correct++;
          }
        });

        const score = Math.round((correct / currentQuiz.totalQuestions) * 100);
        const timeTaken = Date.now() - currentQuiz.createdAt.getTime();

        const completedQuiz: Quiz = {
          ...currentQuiz,
          score,
          completed: true,
          timeTaken,
        };

        // Calculate subject-specific scores for this quiz
        const subjectScores: Record<string, number> = {};
        const topicScores: Record<string, number> = {};
        
        // Group questions by subject and calculate scores
        const subjectQuestions: Record<string, { correct: number; total: number }> = {};
        const topicQuestionCounts: Record<string, { correct: number; total: number }> = {};
        
        currentQuiz.questions.forEach((q, idx) => {
          const isCorrect = currentQuiz.answers[idx] === q.correctAnswer;
          
          // Subject scores
          if (!subjectQuestions[q.subjectId]) {
            subjectQuestions[q.subjectId] = { correct: 0, total: 0 };
          }
          subjectQuestions[q.subjectId].total++;
          if (isCorrect) subjectQuestions[q.subjectId].correct++;
          
          // Topic scores
          if (!topicQuestionCounts[q.topic]) {
            topicQuestionCounts[q.topic] = { correct: 0, total: 0 };
          }
          topicQuestionCounts[q.topic].total++;
          if (isCorrect) topicQuestionCounts[q.topic].correct++;
        });
        
        // Calculate percentages
        Object.entries(subjectQuestions).forEach(([subjectId, data]) => {
          subjectScores[subjectId] = Math.round((data.correct / data.total) * 100);
        });
        
        Object.entries(topicQuestionCounts).forEach(([topic, data]) => {
          topicScores[topic] = Math.round((data.correct / data.total) * 100);
        });
        
        // Identify weak and strong topics
        const weakTopics = Object.entries(topicScores)
          .filter(([_, score]) => score < 50)
          .map(([topic, _]) => topic);
        
        const strongTopics = Object.entries(topicScores)
          .filter(([_, score]) => score >= 80)
          .map(([topic, _]) => topic);

        const updatedQuizHistory = [...quizHistory, completedQuiz];

        set((state) => ({
          currentQuiz: null,
          quizHistory: updatedQuizHistory,
          // Update diagnostic results with actual quiz data
          diagnosticResults: {
            subjectScores: { ...state.diagnosticResults?.subjectScores, ...subjectScores },
            topicScores: { ...state.diagnosticResults?.topicScores, ...topicScores },
            weakTopics: [...new Set([...(state.diagnosticResults?.weakTopics || []), ...weakTopics])],
            strongTopics: [...new Set([...(state.diagnosticResults?.strongTopics || []), ...strongTopics])],
            completed: true,
          },
          currentPage: "dashboard",
        }));

        // Update topic ability
        if (currentQuiz.topicId) {
          get().updateTopicAbility(currentQuiz.topicId, score);
        }

        // Update progress in AI Engine
        if (FEATURES.ENABLE_AI_ENGINE && user) {
          const firstQuestion = currentQuiz.questions[0];
          if (firstQuestion) {
            await aiRoadmapService.updateAIProgress(
              user.id || "user_1",
              firstQuestion.subjectId,
              firstQuestion.topicId || firstQuestion.subjectId,
              score,
            );
          }
        }

        // Roadmap is generated only when the user taps "Generate my roadmap" on the Roadmap page.

        // Update current day if this was a daily quiz
        const currentDay = get().roadmap.find(
          (d) => d.isUnlocked && !d.isCompleted,
        );
        if (currentDay && currentQuiz.type === "daily") {
          set((state) => ({
            roadmap: state.roadmap.map((day) =>
              day.id === currentDay.id
                ? { ...day, quizCompleted: true, quizScore: score }
                : day,
            ),
          }));

          // Complete day if score >= 50
          if (score >= 50) {
            get().completeDay(currentDay.dayNumber);
          } else {
            // Add reinforcement assignment
            get().addAssignment({
              id: `assignment_${Date.now()}`,
              userId: get().user?.id || "user_1",
              title: "Reinforcement: Review Weak Topics",
              description: `You scored ${score}%. Let's strengthen your understanding before moving forward.`,
              subjectId: currentQuiz.subjectId,
              topicId: currentQuiz.topicId || "",
              type: "reinforcement",
              assignedBy: "ai",
              assignedAt: new Date(),
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
              completedAt: null,
              status: "pending",
              points: 50,
            });
          }
        }

        // Update gamification
        set((state) => ({
          gamification: {
            ...state.gamification,
            quizzesCompleted: state.gamification.quizzesCompleted + 1,
            averageScore: Math.round(
              (state.gamification.averageScore *
                state.gamification.quizzesCompleted +
                score) /
                (state.gamification.quizzesCompleted + 1),
            ),
          },
        }));

        // Add points based on score
        const points = score >= 85 ? 150 : score >= 60 ? 100 : 50;
        get().addPoints(points);

        // Check for badges
        if (score === 100) {
          get().unlockBadge("badge_5");
        }
        
        // Check for speed badge (quiz completed in under 2 minutes per question on average)
        const avgTimePerQuestion = timeTaken / currentQuiz.totalQuestions / 1000 / 60; // in minutes
        if (avgTimePerQuestion < 2) {
          get().unlockBadge("badge_8");
        }
      },

      // Task Actions
      addTask: (task) => {
        set((state) => ({ tasks: [...state.tasks, task] }));
      },

      completeTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status: "completed" as const } : t,
          ),
        }));
        get().addPoints(25);
      },

      // Assignment Actions
      addAssignment: (assignment) => {
        set((state) => ({ assignments: [...state.assignments, assignment] }));
      },

      completeAssignment: (assignmentId) => {
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === assignmentId
              ? { ...a, status: "completed" as const, completedAt: new Date() }
              : a,
          ),
        }));
        const assignment = get().assignments.find((a) => a.id === assignmentId);
        if (assignment) {
          get().addPoints(assignment.points);
        }
      },

      // Chat Actions
      addMessage: (message) => {
        set((state) => ({ chatMessages: [...state.chatMessages, message] }));
      },

      clearChat: () => {
        set({ chatMessages: [] });
      },

      // Gamification Actions
      addPoints: (points) => {
        set((state) => {
          const newPoints = state.gamification.points + points;
          return {
            gamification: {
              ...state.gamification,
              points: newPoints,
              level: calculateLevel(newPoints),
              rank: calculateRank(newPoints),
              nextLevelPoints: calculateLevel(newPoints) * 500,
            },
          };
        });
      },

      updateStreak: () => {
        set((state) => {
          const today = new Date();
          const lastStudy = state.user?.lastStudyDate;

          let newStreak = state.gamification.streak;

          if (lastStudy) {
            const lastStudyDate = new Date(lastStudy);
            const diffDays = Math.floor(
              (today.getTime() - lastStudyDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );

            if (diffDays === 1) {
              newStreak += 1;
            } else if (diffDays > 1) {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }

          // Update user lastStudyDate
          const updatedUser = state.user
            ? { ...state.user, lastStudyDate: today }
            : null;

          return {
            user: updatedUser,
            gamification: {
              ...state.gamification,
              streak: newStreak,
              longestStreak: Math.max(
                state.gamification.longestStreak,
                newStreak,
              ),
            },
          };
        });
      },

      unlockBadge: (badgeId) => {
        set((state) => ({
          badges: state.badges.map((b) =>
            b.id === badgeId && !b.unlockedAt
              ? { ...b, unlockedAt: new Date() }
              : b,
          ),
        }));
      },

      // Navigation
      setCurrentPage: (page) => {
        set({ currentPage: page });
      },

      // Reset
      resetApp: () => {
        set({
          user: null,
          isOnboardingComplete: false,
          selectedSubjects: [],
          roadmap: [],
          currentDay: 1,
          currentQuiz: null,
          quizHistory: [],
          diagnosticResults: null,
          tasks: [],
          assignments: [],
          chatMessages: [],
          flashcards: [],
          gamification: getInitialGamification(),
          badges: BADGES,
          currentPage: "onboarding",
        });
      },
    }),
    {
      name: "propella-storage",
    },
  ),
);

// Helper to generate questions from templates (exported for potential future use; template fallback removed from startQuiz)
export function generateQuestions(
  subject: Subject,
  topicId: string | null,
  count: number,
): Question[] {
  const questions: Question[] = [];
  const topics = topicId
    ? subject.topics.filter((t) => t.id === topicId)
    : subject.topics;

  // Sample question templates for each subject
  const questionTemplates: Record<
    string,
    Array<{
      q: string;
      options: string[];
      correct: number;
      explanation: string;
    }>
  > = {
    english: [
      {
        q: "Choose the word that is nearest in meaning to 'Benevolent':",
        options: ["Hostile", "Kind", "Selfish", "Cruel"],
        correct: 1,
        explanation: "Benevolent means well-meaning and kindly.",
      },
      {
        q: "Identify the figure of speech: 'The wind whispered through the trees.'",
        options: ["Simile", "Metaphor", "Personification", "Hyperbole"],
        correct: 2,
        explanation:
          "This is personification as the wind is given human qualities.",
      },
      {
        q: "Choose the correct spelling:",
        options: ["Accomodate", "Accommodate", "Acommodate", "Acomodate"],
        correct: 1,
        explanation:
          "The correct spelling is 'Accommodate' with double 'c' and double 'm'.",
      },
      {
        q: "Which of these is a synonym for 'Happy'?",
        options: ["Sad", "Joyful", "Angry", "Tired"],
        correct: 1,
        explanation: "Joyful is a synonym for Happy.",
      },
      {
        q: "What is the plural of 'Child'?",
        options: ["Childs", "Childrens", "Children", "Childes"],
        correct: 2,
        explanation: "The plural of Child is Children.",
      },
      {
        q: "Which sentence is correct?",
        options: [
          "She go to school",
          "She goes to school",
          "She going to school",
          "She gone to school",
        ],
        correct: 1,
        explanation: "She goes to school is grammatically correct.",
      },
      {
        q: "What is an antonym of 'Ancient'?",
        options: ["Old", "Modern", "Historic", "Antique"],
        correct: 1,
        explanation: "Modern is an antonym of Ancient.",
      },
      {
        q: "Which is a proper noun?",
        options: ["city", "London", "town", "village"],
        correct: 1,
        explanation: "London is a proper noun (specific place name).",
      },
      {
        q: "What is the past tense of 'Go'?",
        options: ["Goes", "Went", "Going", "Gone"],
        correct: 1,
        explanation: "Went is the past tense of Go.",
      },
      {
        q: "Which figure of speech is 'Time is money'?",
        options: ["Simile", "Metaphor", "Personification", "Hyperbole"],
        correct: 1,
        explanation:
          "This is a Metaphor - direct comparison without 'like' or 'as'.",
      },
    ],
    mathematics: [
      {
        q: "What is the derivative of x²?",
        options: ["x", "2x", "x²", "2"],
        correct: 1,
        explanation:
          "Using the power rule: d/dx(xⁿ) = nxⁿ⁻¹, so d/dx(x²) = 2x.",
      },
      {
        q: "Solve for x: 2x + 5 = 15",
        options: ["5", "10", "7.5", "20"],
        correct: 0,
        explanation: "2x = 15 - 5 = 10, therefore x = 5.",
      },
      {
        q: "What is the value of sin(30°)?",
        options: ["0", "0.5", "1", "√3/2"],
        correct: 1,
        explanation: "sin(30°) = 1/2 = 0.5",
      },
      {
        q: "Simplify: 3(x + 4)",
        options: ["3x + 4", "3x + 12", "7x", "3x + 7"],
        correct: 1,
        explanation: "3(x + 4) = 3x + 12 (distributive property)",
      },
      {
        q: "What is 15% of 200?",
        options: ["25", "30", "35", "40"],
        correct: 1,
        explanation: "15% of 200 = 0.15 × 200 = 30",
      },
      {
        q: "If y = 2x + 3, what is y when x = 4?",
        options: ["8", "11", "14", "9"],
        correct: 1,
        explanation: "y = 2(4) + 3 = 8 + 3 = 11",
      },
      {
        q: "What is the square root of 144?",
        options: ["10", "11", "12", "14"],
        correct: 2,
        explanation: "√144 = 12 because 12 × 12 = 144",
      },
      {
        q: "What is 3³?",
        options: ["6", "9", "27", "12"],
        correct: 2,
        explanation: "3³ = 3 × 3 × 3 = 27",
      },
      {
        q: "Solve: x/4 = 8",
        options: ["2", "32", "12", "4"],
        correct: 1,
        explanation: "x = 8 × 4 = 32",
      },
      {
        q: "What is the next number: 2, 4, 8, 16, ?",
        options: ["24", "32", "28", "20"],
        correct: 1,
        explanation: "Each number is multiplied by 2: 16 × 2 = 32",
      },
    ],
    physics: [
      {
        q: "What is the SI unit of force?",
        options: ["Watt", "Joule", "Newton", "Pascal"],
        correct: 2,
        explanation: "The Newton (N) is the SI unit of force.",
      },
      {
        q: "What is the speed of light in vacuum?",
        options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"],
        correct: 0,
        explanation:
          "The speed of light in vacuum is approximately 3 × 10⁸ m/s.",
      },
      {
        q: "What is the formula for kinetic energy?",
        options: ["KE = mv", "KE = ½mv²", "KE = mgh", "KE = mv²"],
        correct: 1,
        explanation: "Kinetic Energy = ½mv²",
      },
      {
        q: "What is the unit of resistance?",
        options: ["Volt", "Ampere", "Ohm", "Watt"],
        correct: 2,
        explanation: "Ohm (Ω) is the unit of electrical resistance.",
      },
      {
        q: "What type of lens is used to correct myopia?",
        options: ["Convex", "Concave", "Bifocal", "Plano"],
        correct: 1,
        explanation: "Concave (diverging) lenses correct nearsightedness.",
      },
      {
        q: "What is the acceleration due to gravity on Earth?",
        options: ["9.8 m/s²", "10 m/s²", "8.9 m/s²", "12 m/s²"],
        correct: 0,
        explanation: "g = 9.8 m/s² on Earth's surface.",
      },
      {
        q: "Which wave property determines loudness?",
        options: ["Frequency", "Wavelength", "Amplitude", "Speed"],
        correct: 2,
        explanation: "Amplitude determines loudness of sound.",
      },
      {
        q: "What is the formula for pressure?",
        options: ["P = F/A", "P = F×A", "P = A/F", "P = F + A"],
        correct: 0,
        explanation: "Pressure = Force/Area",
      },
      {
        q: "What type of force is gravity?",
        options: ["Magnetic", "Nuclear", "Gravitational", "Frictional"],
        correct: 2,
        explanation: "Gravity is a gravitational force.",
      },
      {
        q: "What is the law of inertia also known as?",
        options: [
          "Newton's First Law",
          "Newton's Second Law",
          "Newton's Third Law",
          "Law of Conservation",
        ],
        correct: 0,
        explanation: "Law of inertia is Newton's First Law of Motion.",
      },
    ],
    chemistry: [
      {
        q: "What is the chemical formula for water?",
        options: ["CO₂", "H₂O", "NaCl", "O₂"],
        correct: 1,
        explanation: "Water is H₂O - two hydrogen atoms and one oxygen atom.",
      },
      {
        q: "Which gas is known as the 'laughing gas'?",
        options: ["Oxygen", "Nitrous oxide", "Carbon dioxide", "Helium"],
        correct: 1,
        explanation: "Nitrous oxide (N₂O) is commonly known as laughing gas.",
      },
      {
        q: "What is the atomic number of Carbon?",
        options: ["4", "6", "12", "8"],
        correct: 1,
        explanation: "Carbon has atomic number 6.",
      },
      {
        q: "Which element has the chemical symbol 'Na'?",
        options: ["Nickel", "Sodium", "Nitrogen", "Neon"],
        correct: 1,
        explanation: "Na is the symbol for Sodium (Natrium).",
      },
      {
        q: "What type of bond forms between Na and Cl?",
        options: ["Covalent", "Ionic", "Metallic", "Hydrogen"],
        correct: 1,
        explanation: "NaCl is an ionic bond (metal + nonmetal).",
      },
      {
        q: "What is the pH of pure water?",
        options: ["0", "7", "14", "5"],
        correct: 1,
        explanation: "Pure water is neutral with pH = 7.",
      },
      {
        q: "Which gas is released when an acid reacts with a metal?",
        options: ["Oxygen", "Nitrogen", "Hydrogen", "Carbon dioxide"],
        correct: 2,
        explanation: "Acids + metals produce Hydrogen gas.",
      },
      {
        q: "What is the formula for table salt?",
        options: ["KCl", "NaCl", "CaCl₂", "MgCl₂"],
        correct: 1,
        explanation: "Table salt is Sodium Chloride (NaCl).",
      },
      {
        q: "Which element is a noble gas?",
        options: ["Oxygen", "Nitrogen", "Helium", "Hydrogen"],
        correct: 2,
        explanation: "Helium is a noble gas (Group 18).",
      },
      {
        q: "What is the process where solid turns to gas called?",
        options: ["Melting", "Evaporation", "Sublimation", "Condensation"],
        correct: 2,
        explanation: "Sublimation is solid to gas without liquid state.",
      },
    ],
    biology: [
      {
        q: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
        correct: 1,
        explanation: "Mitochondria are known as the powerhouse of the cell.",
      },
      {
        q: "What is the basic unit of life?",
        options: ["Tissue", "Organ", "Cell", "Molecule"],
        correct: 2,
        explanation:
          "The cell is the basic structural and functional unit of life.",
      },
      {
        q: "Which organelle contains chlorophyll?",
        options: ["Mitochondria", "Ribosome", "Chloroplast", "Nucleus"],
        correct: 2,
        explanation: "Chloroplast contains chlorophyll for photosynthesis.",
      },
      {
        q: "What is the function of red blood cells?",
        options: [
          "Fight infection",
          "Carry oxygen",
          "Clot blood",
          "Produce hormones",
        ],
        correct: 1,
        explanation: "Red blood cells carry oxygen in the blood.",
      },
      {
        q: "Which gas do plants absorb from the atmosphere?",
        options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
        correct: 2,
        explanation: "Plants absorb CO₂ for photosynthesis.",
      },
      {
        q: "What is the largest organ in the human body?",
        options: ["Heart", "Liver", "Skin", "Brain"],
        correct: 2,
        explanation: "Skin is the largest organ.",
      },
      {
        q: "Which blood type is the universal donor?",
        options: ["A", "B", "AB", "O"],
        correct: 3,
        explanation: "Type O negative is the universal donor.",
      },
      {
        q: "What is the process of cell division called?",
        options: ["Mitosis", "Osmosis", "Diffusion", "Respiration"],
        correct: 0,
        explanation: "Mitosis is cell division for growth and repair.",
      },
      {
        q: "Which organ produces insulin?",
        options: ["Liver", "Kidney", "Pancreas", "Heart"],
        correct: 2,
        explanation: "The pancreas produces insulin.",
      },
      {
        q: "What is the function of white blood cells?",
        options: [
          "Carry oxygen",
          "Fight infection",
          "Clot blood",
          "Transport nutrients",
        ],
        correct: 1,
        explanation: "White blood cells fight infection.",
      },
    ],
    government: [
      {
        q: "What type of government does Nigeria practice?",
        options: ["Monarchy", "Federal Republic", "Unitary", "Confederation"],
        correct: 1,
        explanation:
          "Nigeria is a Federal Republic with a presidential system.",
      },
      {
        q: "How many senators represent each state in Nigeria?",
        options: ["1", "2", "3", "4"],
        correct: 2,
        explanation: "Each state in Nigeria has 3 senators.",
      },
      {
        q: "Who is the head of government in Nigeria?",
        options: ["President", "Governor", "Senate President", "Chief Justice"],
        correct: 0,
        explanation: "The President is the head of government.",
      },
      {
        q: "What is the meaning of democracy?",
        options: [
          "Rule by one",
          "Rule by few",
          "Rule by the people",
          "Rule by military",
        ],
        correct: 2,
        explanation: "Democracy means rule by the people.",
      },
      {
        q: "How many local governments are in Nigeria?",
        options: ["774", "36", "109", "650"],
        correct: 0,
        explanation: "Nigeria has 774 local government areas.",
      },
      {
        q: "What is the capital of Nigeria?",
        options: ["Lagos", "Abuja", "Kano", "Port Harcourt"],
        correct: 1,
        explanation: "Abuja is the capital city of Nigeria.",
      },
      {
        q: "What is federalism?",
        options: [
          "Central government",
          "State sharing power with central",
          "Military rule",
          "One party system",
        ],
        correct: 1,
        explanation:
          "Federalism is power sharing between central and state governments.",
      },
      {
        q: "Who appoints the Chief Justice of Nigeria?",
        options: ["Senate", "President", "National Assembly", "Governors"],
        correct: 1,
        explanation: "The President appoints the Chief Justice.",
      },
      {
        q: "What is the lowest tier of government in Nigeria?",
        options: ["State", "Local Government", "Ward", "Community"],
        correct: 1,
        explanation: "Local Government is the lowest tier.",
      },
      {
        q: "What does INEC stand for?",
        options: [
          "Independent National Electoral Commission",
          "Internal National Election Council",
          "Independent Nigerian Electoral Commission",
          "International National Election Committee",
        ],
        correct: 0,
        explanation: "INEC = Independent National Electoral Commission.",
      },
    ],
    economics: [
      {
        q: "What is the law of demand?",
        options: [
          "Price increases, demand increases",
          "Price increases, demand decreases",
          "Price decreases, supply increases",
          "Supply increases, price increases",
        ],
        correct: 1,
        explanation:
          "The law of demand states that as price increases, quantity demanded decreases.",
      },
      {
        q: "What is GDP?",
        options: [
          "Gross Domestic Product",
          "Government Debt Payment",
          "General Development Plan",
          "Global Demand Price",
        ],
        correct: 0,
        explanation:
          "GDP = Gross Domestic Product - total value of goods/services.",
      },
      {
        q: "What is inflation?",
        options: [
          "Decrease in prices",
          "Increase in prices",
          "Stable prices",
          "No prices",
        ],
        correct: 1,
        explanation: "Inflation is the general increase in prices.",
      },
      {
        q: "What is a monopoly?",
        options: [
          "Many sellers",
          "One seller",
          "Many buyers",
          "Government controls",
        ],
        correct: 1,
        explanation: "Monopoly is when one seller controls the market.",
      },
      {
        q: "What is supply?",
        options: [
          "What consumers want",
          "What producers offer",
          "Price control",
          "Tax collection",
        ],
        correct: 1,
        explanation: "Supply is what producers are willing to offer for sale.",
      },
      {
        q: "What is the role of the Central Bank?",
        options: [
          "Print money",
          "Give loans to students",
          "Control interest rates",
          "Both A and C",
        ],
        correct: 3,
        explanation: "Central Bank controls money supply and interest rates.",
      },
      {
        q: "What is opportunity cost?",
        options: [
          "Money cost",
          "Next best alternative foregone",
          "Total cost",
          "Fixed cost",
        ],
        correct: 1,
        explanation: "Opportunity cost is the next best alternative given up.",
      },
      {
        q: "What is a market equilibrium?",
        options: [
          "Price fixed by government",
          "Supply equals demand",
          "Price too high",
          "Price too low",
        ],
        correct: 1,
        explanation: "Equilibrium is when supply equals demand.",
      },
      {
        q: "What is foreign exchange?",
        options: [
          "International trade",
          "Currency exchange",
          "Import tax",
          "Export duty",
        ],
        correct: 1,
        explanation: "Foreign exchange is trading one currency for another.",
      },
      {
        q: "What is development economics concerned with?",
        options: [
          "Wealthy nations only",
          "Poor nations development",
          "Stock market",
          "Banking only",
        ],
        correct: 1,
        explanation:
          "Development economics focuses on improving developing nations.",
      },
    ],
    literature: [
      {
        q: "Who wrote 'Things Fall Apart'?",
        options: [
          "Wole Soyinka",
          "Chinua Achebe",
          "Chimamanda Adichie",
          "Ben Okri",
        ],
        correct: 1,
        explanation: "Things Fall Apart was written by Chinua Achebe.",
      },
      {
        q: "What is a simile?",
        options: [
          "Comparison using like/as",
          "Exaggeration",
          "Human qualities to objects",
          "Opposite meaning",
        ],
        correct: 0,
        explanation: "Simile compares using 'like' or 'as'.",
      },
      {
        q: "What is alliteration?",
        options: [
          "Opposite sounds",
          "Repeated consonant sounds",
          "Rhyme scheme",
          "Story pattern",
        ],
        correct: 1,
        explanation: "Alliteration is repeated consonant sounds.",
      },
      {
        q: "What is a metaphor?",
        options: [
          "Comparison using like",
          "Direct comparison",
          "Exaggeration",
          "Sound words",
        ],
        correct: 1,
        explanation: "Metaphor is direct comparison without like/as.",
      },
      {
        q: "Who wrote 'The Lion and the Jewel'?",
        options: [
          "Chinua Achebe",
          "Wole Soyinka",
          "John Pepper Clark",
          "Duro Ladipo",
        ],
        correct: 1,
        explanation: "Wole Soyinka wrote The Lion and the Jewel.",
      },
      {
        q: "What is irony?",
        options: [
          "Rhyming words",
          "Expected vs actual",
          "Exaggeration",
          "Repetition",
        ],
        correct: 1,
        explanation: "Irony is when expected outcome differs from actual.",
      },
      {
        q: "What is a ballad?",
        options: ["Love story", "Traditional song/poem", "Play", "Novel"],
        correct: 1,
        explanation: "Ballad is a traditional narrative poem or song.",
      },
      {
        q: "What is personification?",
        options: [
          "Comparing like",
          "Human traits to non-human",
          "Exaggeration",
          "Sound words",
        ],
        correct: 1,
        explanation: "Personification gives human traits to non-human things.",
      },
      {
        q: "Who is the author of 'The Secret River'?",
        options: [
          "Chinua Achebe",
          "Kate Grenville",
          "Ben Okri",
          "Ngũgĩ wa Thiong'o",
        ],
        correct: 1,
        explanation: "Kate Grenville wrote The Secret River.",
      },
      {
        q: "What is hyperbole?",
        options: [
          "Understatement",
          "Exaggeration",
          "Comparison",
          "Sound pattern",
        ],
        correct: 1,
        explanation: "Hyperbole is extreme exaggeration for effect.",
      },
    ],
    accounting: [
      {
        q: "What is the accounting equation?",
        options: [
          "Assets = Liabilities + Capital",
          "Assets + Liabilities = Capital",
          "Assets = Liabilities - Capital",
          "Assets - Liabilities = Capital",
        ],
        correct: 0,
        explanation: "The fundamental accounting equation is Assets = Liabilities + Capital (Equity).",
      },
      {
        q: "What type of account is Cash?",
        options: [
          "Liability",
          "Asset",
          "Expense",
          "Income",
        ],
        correct: 1,
        explanation: "Cash is an asset account representing money owned by the business.",
      },
      {
        q: "What is depreciation?",
        options: [
          "Increase in asset value",
          "Decrease in asset value over time",
          "Buying new assets",
          "Selling assets",
        ],
        correct: 1,
        explanation: "Depreciation is the systematic allocation of the cost of a fixed asset over its useful life.",
      },
      {
        q: "Which book is used to record credit purchases?",
        options: [
          "Sales Day Book",
          "Purchases Day Book",
          "Cash Book",
          "Journal Proper",
        ],
        correct: 1,
        explanation: "The Purchases Day Book records all credit purchases of goods.",
      },
      {
        q: "What is a trial balance?",
        options: [
          "A financial statement",
          "A list of all ledger account balances",
          "A bank statement",
          "A list of debtors",
        ],
        correct: 1,
        explanation: "A trial balance is a list of all general ledger accounts and their balances at a specific date.",
      },
      {
        q: "What is a debit note?",
        options: [
          "Sent when returning goods",
          "Sent when receiving goods",
          "Sent when paying cash",
          "Sent when receiving payment",
        ],
        correct: 0,
        explanation: "A debit note is issued by a buyer when returning goods to a supplier.",
      },
      {
        q: "What type of account is Creditors?",
        options: [
          "Asset",
          "Liability",
          "Income",
          "Expense",
        ],
        correct: 1,
        explanation: "Creditors (Accounts Payable) represent amounts owed to suppliers and are liabilities.",
      },
      {
        q: "What is the purpose of a bank reconciliation statement?",
        options: [
          "To calculate profit",
          "To reconcile cash book and bank statement differences",
          "To prepare trial balance",
          "To record sales",
        ],
        correct: 1,
        explanation: "Bank reconciliation identifies differences between the cash book balance and bank statement.",
      },
      {
        q: "Which concept states that business transactions should be separate from personal transactions?",
        options: [
          "Going concern",
          "Business entity concept",
          "Money measurement",
          "Dual aspect",
        ],
        correct: 1,
        explanation: "The business entity concept states that business and owner's transactions are separate.",
      },
      {
        q: "What is the normal balance of an expense account?",
        options: [
          "Credit",
          "Debit",
          "Zero",
          "Negative",
        ],
        correct: 1,
        explanation: "Expense accounts normally have debit balances as expenses reduce capital.",
      },
    ],
    agricultural_science: [
      {
        q: "What is the process of removing weeds from farmland called?",
        options: [
          "Planting",
          "Weeding",
          "Harvesting",
          "Tilling",
        ],
        correct: 1,
        explanation: "Weeding is the removal of unwanted plants (weeds) from cultivated land.",
      },
      {
        q: "Which of these is a macronutrient required by plants?",
        options: [
          "Zinc",
          "Nitrogen",
          "Iron",
          "Copper",
        ],
        correct: 1,
        explanation: "Nitrogen is a macronutrient essential for plant growth and leaf development.",
      },
      {
        q: "What type of farm animal is a goat?",
        options: [
          "Monogastric",
          "Ruminant",
          "Non-ruminant",
          "Carnivore",
        ],
        correct: 1,
        explanation: "Goats are ruminants with four-compartment stomachs for digesting roughage.",
      },
      {
        q: "What is the male reproductive organ of a flower called?",
        options: [
          "Pistil",
          "Stamen",
          "Ovary",
          "Sepal",
        ],
        correct: 1,
        explanation: "The stamen is the male reproductive part of a flower producing pollen.",
      },
      {
        q: "Which farming system involves growing crops and raising animals together?",
        options: [
          "Mono-cropping",
          "Mixed farming",
          "Shifting cultivation",
          "Plantation farming",
        ],
        correct: 1,
        explanation: "Mixed farming combines crop cultivation with livestock rearing on the same farm.",
      },
      {
        q: "What is the main function of the xylem in plants?",
        options: [
          "Food transport",
          "Water and mineral transport",
          "Photosynthesis",
          "Protection",
        ],
        correct: 1,
        explanation: "Xylem transports water and dissolved minerals from roots to other plant parts.",
      },
      {
        q: "What is pasteurization?",
        options: [
          "Freezing food",
          "Heating to kill harmful bacteria",
          "Drying food",
          "Smoking food",
        ],
        correct: 1,
        explanation: "Pasteurization involves heating food (especially milk) to destroy pathogenic bacteria.",
      },
      {
        q: "Which of these is a leguminous crop?",
        options: [
          "Maize",
          "Cowpea",
          "Cassava",
          "Yam",
        ],
        correct: 1,
        explanation: "Cowpea is a legume that fixes atmospheric nitrogen through root nodules.",
      },
      {
        q: "What is the process of crossing different varieties of plants called?",
        options: [
          "Cloning",
          "Hybridization",
          "Grafting",
          "Layering",
        ],
        correct: 1,
        explanation: "Hybridization is crossing genetically different plants to produce hybrids with desired traits.",
      },
      {
        q: "What is the best method for preserving fish in rural areas without refrigeration?",
        options: [
          "Canning",
          "Smoking",
          "Freezing",
          "Pasteurizing",
        ],
        correct: 1,
        explanation: "Smoking is a traditional method of fish preservation that doesn't require electricity.",
      },
    ],
    geography: [
      {
        q: "What is the study of the Earth's surface and its features called?",
        options: [
          "Geology",
          "Geography",
          "Astronomy",
          "Biology",
        ],
        correct: 1,
        explanation: "Geography is the study of Earth's landscapes, environments, places, and relationships.",
      },
      {
        q: "Which line divides the Earth into Northern and Southern Hemispheres?",
        options: [
          "Prime Meridian",
          "Equator",
          "Tropic of Cancer",
          "Arctic Circle",
        ],
        correct: 1,
        explanation: "The Equator (0° latitude) divides Earth into Northern and Southern Hemispheres.",
      },
      {
        q: "What type of rock is formed from cooled magma or lava?",
        options: [
          "Sedimentary",
          "Metamorphic",
          "Igneous",
          "Limestone",
        ],
        correct: 2,
        explanation: "Igneous rocks form when molten material (magma/lava) cools and solidifies.",
      },
      {
        q: "What is the largest ocean on Earth?",
        options: [
          "Atlantic Ocean",
          "Indian Ocean",
          "Pacific Ocean",
          "Arctic Ocean",
        ],
        correct: 2,
        explanation: "The Pacific Ocean is the largest, covering about 30% of Earth's surface.",
      },
      {
        q: "What instrument is used to measure atmospheric pressure?",
        options: [
          "Thermometer",
          "Barometer",
          "Hygrometer",
          "Anemometer",
        ],
        correct: 1,
        explanation: "A barometer measures atmospheric pressure, useful for weather prediction.",
      },
      {
        q: "What is the main cause of day and night?",
        options: [
          "Earth's revolution",
          "Earth's rotation",
          "Moon's orbit",
          "Sun's rotation",
        ],
        correct: 1,
        explanation: "Earth's rotation on its axis causes the cycle of day and night.",
      },
      {
        q: "What type of rainfall occurs when warm air is forced to rise over mountains?",
        options: [
          "Convectional rainfall",
          "Relief (orographic) rainfall",
          "Cyclonic rainfall",
          "Frontal rainfall",
        ],
        correct: 1,
        explanation: "Relief rainfall occurs when moist air rises over mountains, cools, and condenses.",
      },
      {
        q: "What is the capital city of Nigeria?",
        options: [
          "Lagos",
          "Abuja",
          "Kano",
          "Ibadan",
        ],
        correct: 1,
        explanation: "Abuja became Nigeria's capital in 1991, replacing Lagos.",
      },
      {
        q: "Which of these is a renewable resource?",
        options: [
          "Coal",
          "Petroleum",
          "Solar energy",
          "Natural gas",
        ],
        correct: 2,
        explanation: "Solar energy is renewable as it comes from the sun and is virtually inexhaustible.",
      },
      {
        q: "What does GPS stand for?",
        options: [
          "Global Positioning System",
          "Geographic Position Satellite",
          "Global Pointing Service",
          "Geographic Positioning Service",
        ],
        correct: 0,
        explanation: "GPS (Global Positioning System) uses satellites to determine precise locations on Earth.",
      },
    ],
    commerce: [
      {
        q: "What is commerce?",
        options: [
          "Production of goods",
          "Exchange of goods and services",
          "Farming activities",
          "Manufacturing only",
        ],
        correct: 1,
        explanation: "Commerce involves all activities that facilitate the exchange of goods and services.",
      },
      {
        q: "Which factor of production is represented by money invested in a business?",
        options: [
          "Land",
          "Labor",
          "Capital",
          "Entrepreneurship",
        ],
        correct: 2,
        explanation: "Capital refers to money, machinery, and equipment used to produce goods and services.",
      },
      {
        q: "What is a sole proprietorship?",
        options: [
          "Business owned by many people",
          "Business owned by one person",
          "Government business",
          "International business",
        ],
        correct: 1,
        explanation: "A sole proprietorship is a business owned and managed by a single individual.",
      },
      {
        q: "What is advertising?",
        options: [
          "Making products",
          "Promoting products to potential customers",
          "Storing goods",
          "Transporting goods",
        ],
        correct: 1,
        explanation: "Advertising is a form of marketing communication to promote products or services.",
      },
      {
        q: "What is the document sent by a seller to a buyer stating goods sold and amount due?",
        options: [
          "Purchase order",
          "Invoice",
          "Receipt",
          "Debit note",
        ],
        correct: 1,
        explanation: "An invoice is a commercial document issued by a seller to a buyer, indicating products/services and payment amount.",
      },
      {
        q: "Which type of trade occurs within a country's borders?",
        options: [
          "International trade",
          "Home (internal) trade",
          "Export trade",
          "Import trade",
        ],
        correct: 1,
        explanation: "Home or internal trade involves buying and selling goods within the same country.",
      },
      {
        q: "What is a retailer?",
        options: [
          "Buys in bulk and sells to other traders",
          "Sells directly to final consumers",
          "Manufactures goods",
          "Provides transport services",
        ],
        correct: 1,
        explanation: "A retailer sells goods in small quantities directly to the final consumers.",
      },
      {
        q: "What is insurance?",
        options: [
          "A form of banking",
          "Protection against financial loss",
          "A type of investment",
          "Method of transport",
        ],
        correct: 1,
        explanation: "Insurance is a contract providing financial protection or reimbursement against losses.",
      },
      {
        q: "What is a partnership in business?",
        options: [
          "Business owned by government",
          "Business owned by 2 to 20 people",
          "Business owned by one person",
          "International business agreement",
        ],
        correct: 1,
        explanation: "A partnership is a business owned by 2 to 20 people who share profits and liabilities.",
      },
      {
        q: "What does e-commerce mean?",
        options: [
          "Economic commerce",
          "Electronic commerce",
          "Efficient commerce",
          "Export commerce",
        ],
        correct: 1,
        explanation: "E-commerce refers to buying and selling goods/services over the internet.",
      },
    ],
    history: [
      {
        q: "Which ancient Nigerian civilization was known for the Nok terracotta sculptures?",
        options: [
          "Benin Kingdom",
          "Nok Culture",
          "Oyo Empire",
          "Kanem-Bornu",
        ],
        correct: 1,
        explanation: "The Nok Culture (500 BCE - 200 CE) is famous for its terracotta sculptures.",
      },
      {
        q: "Who was the first President of independent Nigeria?",
        options: [
          "Obafemi Awolowo",
          "Nnamdi Azikiwe",
          "Tafawa Balewa",
          "Ahmadu Bello",
        ],
        correct: 1,
        explanation: "Dr. Nnamdi Azikiwe became Nigeria's first President when Nigeria gained independence in 1960.",
      },
      {
        q: "What year did Nigeria gain independence from Britain?",
        options: [
          "1957",
          "1960",
          "1963",
          "1970",
        ],
        correct: 1,
        explanation: "Nigeria gained independence from British colonial rule on October 1, 1960.",
      },
      {
        q: "Which empire was known as the center of Islamic learning and trade in medieval West Africa?",
        options: [
          "Ghana Empire",
          "Mali Empire",
          "Songhai Empire",
          "All of the above",
        ],
        correct: 3,
        explanation: "The Ghana, Mali, and Songhai Empires were all centers of Islamic learning and trans-Saharan trade.",
      },
      {
        q: "What was the main reason for European colonization of Africa?",
        options: [
          "To spread religion only",
          "Economic exploitation and resources",
          "To unite African kingdoms",
          "Scientific research only",
        ],
        correct: 1,
        explanation: "Economic exploitation, including access to raw materials and markets, drove European colonization.",
      },
      {
        q: "Who was the prominent nationalist that led the movement for Nigerian independence?",
        options: [
          "Herbert Macaulay",
          "All of the options",
          "Obafemi Awolowo",
          "Nnamdi Azikiwe",
        ],
        correct: 1,
        explanation: "Multiple nationalists including Herbert Macaulay, Awolowo, and Azikiwe contributed to independence.",
      },
      {
        q: "What system of government did Nigeria practice between 1960-1966?",
        options: [
          "Presidential system",
          "Parliamentary system",
          "Military rule",
          "Federal system",
        ],
        correct: 1,
        explanation: "Nigeria practiced the Westminster parliamentary system from independence until the 1966 coup.",
      },
      {
        q: "Which city was the capital of the Benin Empire?",
        options: [
          "Lagos",
          "Benin City",
          "Ife",
          "Warri",
        ],
        correct: 1,
        explanation: "Benin City was the capital of the powerful Benin Empire, known for its art and bronze works.",
      },
      {
        q: "What was the trans-Atlantic slave trade?",
        options: [
          "Trade within Africa",
          "Forced transportation of Africans to the Americas",
          "Trade between Europe and Asia",
          "Voluntary migration",
        ],
        correct: 1,
        explanation: "The trans-Atlantic slave trade forcibly transported millions of Africans to work in the Americas.",
      },
      {
        q: "Which event marked the end of the Nigerian Civil War?",
        options: [
          "The 1966 coup",
          "The surrender of Biafra in 1970",
          "Independence in 1960",
          "The 1979 election",
        ],
        correct: 1,
        explanation: "The Nigerian Civil War (1967-1970) ended with Biafra's surrender on January 15, 1970.",
      },
    ],
    crs: [
      {
        q: "Who is considered the founder of Christianity?",
        options: [
          "Paul",
          "Jesus Christ",
          "Peter",
          "Moses",
        ],
        correct: 1,
        explanation: "Jesus Christ is the central figure and founder of Christianity.",
      },
      {
        q: "What are the first four books of the New Testament called?",
        options: [
          "Epistles",
          "Gospels",
          "Psalms",
          "Prophecies",
        ],
        correct: 1,
        explanation: "Matthew, Mark, Luke, and John are the four Gospels that record Jesus' life and teachings.",
      },
      {
        q: "What event is celebrated at Easter?",
        options: [
          "Jesus' birth",
          "Jesus' resurrection",
          "Jesus' baptism",
          "Pentecost",
        ],
        correct: 1,
        explanation: "Easter celebrates the resurrection of Jesus Christ from the dead.",
      },
      {
        q: "Who led the Israelites out of Egypt?",
        options: [
          "Abraham",
          "Moses",
          "David",
          "Joseph",
        ],
        correct: 1,
        explanation: "Moses led the Exodus, delivering Israelites from slavery in Egypt.",
      },
      {
        q: "What is the Golden Rule in Christianity?",
        options: [
          "Love your enemies",
          "Do to others as you would have them do to you",
          "Pray daily",
          "Keep the Sabbath",
        ],
        correct: 1,
        explanation: "Jesus taught: 'Do to others as you would have them do to you' (Matthew 7:12).",
      },
      {
        q: "What is the Trinity in Christian belief?",
        options: [
          "Three separate gods",
          "Father, Son, and Holy Spirit as one God",
          "Three apostles",
          "Three churches",
        ],
        correct: 1,
        explanation: "The Trinity refers to one God existing as three persons: Father, Son, and Holy Spirit.",
      },
      {
        q: "Who wrote most of the epistles in the New Testament?",
        options: [
          "Peter",
          "Paul",
          "John",
          "James",
        ],
        correct: 1,
        explanation: "Paul (Saul of Tarsus) authored many letters (epistles) to early Christian communities.",
      },
      {
        q: "What sacrament commemorates Jesus' last supper?",
        options: [
          "Baptism",
          "Holy Communion (Eucharist)",
          "Confirmation",
          "Marriage",
        ],
        correct: 1,
        explanation: "Holy Communion (Eucharist) commemorates Christ's sacrifice through bread and wine.",
      },
      {
        q: "What is the first book of the Bible?",
        options: [
          "Exodus",
          "Genesis",
          "Psalms",
          "Matthew",
        ],
        correct: 1,
        explanation: "Genesis is the first book, describing creation and early human history.",
      },
      {
        q: "What virtue is described as the greatest in 1 Corinthians 13?",
        options: [
          "Faith",
          "Hope",
          "Love (Charity)",
          "Wisdom",
        ],
        correct: 2,
        explanation: "Paul writes that of faith, hope, and love, the greatest is love (1 Cor 13:13).",
      },
    ],
    irs: [
      {
        q: "What is the holy book of Islam called?",
        options: [
          "Bible",
          "Qur'an",
          "Torah",
          "Hadith",
        ],
        correct: 1,
        explanation: "The Qur'an is Islam's holy book, believed to be Allah's word revealed to Muhammad.",
      },
      {
        q: "How many times a day do Muslims pray (Salah)?",
        options: [
          "Three",
          "Five",
          "Seven",
          "Once",
        ],
        correct: 1,
        explanation: "Muslims pray five times daily: Fajr, Dhuhr, Asr, Maghrib, and Isha.",
      },
      {
        q: "What is the month of fasting in Islam called?",
        options: [
          "Muharram",
          "Ramadan",
          "Shawwal",
          "Dhul-Hijjah",
        ],
        correct: 1,
        explanation: "Ramadan is the ninth month when Muslims fast from dawn to sunset.",
      },
      {
        q: "What is the Islamic declaration of faith called?",
        options: [
          "Salah",
          "Shahadah",
          "Zakat",
          "Hajj",
        ],
        correct: 1,
        explanation: "The Shahadah (There is no god but Allah, Muhammad is His messenger) is the first pillar.",
      },
      {
        q: "What is Zakat?",
        options: [
          "Prayer",
          "Charitable giving (alms)",
          "Fasting",
          "Pilgrimage",
        ],
        correct: 1,
        explanation: "Zakat is the obligatory giving of a portion of wealth to the poor (2.5% for most Muslims).",
      },
      {
        q: "What is the Ka'bah?",
        options: [
          "A mosque in Medina",
          "The sacred cubic structure in Makkah",
          "A holy mountain",
          "An Islamic school",
        ],
        correct: 1,
        explanation: "The Ka'bah is the sacred cubic structure in Makkah toward which Muslims pray.",
      },
      {
        q: "What is the pilgrimage to Makkah called?",
        options: [
          "Umrah",
          "Hajj",
          "Ziyarah",
          "Hijrah",
        ],
        correct: 1,
        explanation: "Hajj is the obligatory pilgrimage to Makkah that every able Muslim must perform once.",
      },
      {
        q: "Who is considered the last prophet in Islam?",
        options: [
          "Moses",
          "Jesus",
          "Muhammad",
          "Abraham",
        ],
        correct: 2,
        explanation: "Muhammad (PBUH) is regarded as the final prophet and messenger of Allah.",
      },
      {
        q: "What are the sayings and actions of Prophet Muhammad called?",
        options: [
          "Qur'an",
          "Sunnah/Hadith",
          "Fatwa",
          "Shariah",
        ],
        correct: 1,
        explanation: "Hadith are the recorded sayings, actions, and approvals of Prophet Muhammad.",
      },
      {
        q: "What is the Islamic law derived from the Qur'an and Sunnah called?",
        options: [
          "Fiqh",
          "Shariah",
          "Tafsir",
          "Ijma",
        ],
        correct: 1,
        explanation: "Shariah is Islamic law based on the Qur'an and Sunnah, guiding all aspects of life.",
      },
    ],
  };

  const templates = questionTemplates[subject.id] || questionTemplates.english;

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const topic = topics[i % topics.length];

    questions.push({
      id: `q_${Date.now()}_${i}`,
      subjectId: subject.id,
      topicId: topic?.id || "",
      year: 2020 + (i % 4),
      question: template.q,
      options: template.options,
      correctAnswer: template.correct,
      explanation: template.explanation,
      difficulty: i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard",
      topic: topic?.name || "General",
    });
  }

  return questions;
}
