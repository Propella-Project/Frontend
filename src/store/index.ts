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
    | "catalog";
  isLoading: boolean;

  // Onboarding Actions
  setUser: (user: Partial<User>) => void;
  setSelectedSubjects: (subjects: Subject[]) => void;
  completeOnboarding: () => void;
  resumeOnboarding: () => void;
  completeDiagnosticQuiz: (results: AppState["diagnosticResults"]) => void;

  // Subject Actions
  updateTopicAbility: (topicId: string, score: number) => void;

  // Roadmap Actions
  generateRoadmap: () => void;
  unlockDay: (dayNumber: number) => void;
  completeDay: (dayNumber: number) => void;

  // Quiz Actions
  startQuiz: (
    subjectId: string,
    topicId: string | null,
    type: Quiz["type"],
    subjectIds?: string[],
  ) => void;
  answerQuestion: (questionIndex: number, answer: number) => void;
  completeQuiz: () => void;

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
          // Generate roadmap after onboarding
          get().generateRoadmap();
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
      generateRoadmap: () => {
        const { user, subjects } = get();
        if (!user || !user.examDate) return;

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

        set({ roadmap });
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
      startQuiz: (subjectId, topicId, type, subjectIds) => {
        const { subjects } = get();

        let questions: Question[] = [];

        // For diagnostic quiz with multiple subjects
        if (type === "diagnostic" && subjectIds && subjectIds.length > 0) {
          const questionsPerSubject = Math.floor(12 / subjectIds.length);

          subjectIds.forEach((sid) => {
            const subject = subjects.find((s) => s.id === sid);
            if (subject) {
              const subjectQuestions = generateQuestions(
                subject,
                null,
                questionsPerSubject,
              );
              questions = [...questions, ...subjectQuestions];
            }
          });

          // Add more questions from first subject if needed
          while (questions.length < 12) {
            const subject = subjects.find((s) => s.id === subjectIds[0]);
            if (subject) {
              const additionalQuestions = generateQuestions(subject, null, 1);
              questions = [...questions, ...additionalQuestions];
            } else {
              break;
            }
          }

          questions = questions.slice(0, 12);
        } else {
          // Single subject quiz
          const subject = subjects.find((s) => s.id === subjectId);
          if (!subject) return;

          questions = generateQuestions(
            subject,
            topicId,
            type === "diagnostic" ? 5 : 10,
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

        set({ currentQuiz: quiz, currentPage: "quiz" });
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

      completeQuiz: () => {
        const { currentQuiz } = get();
        if (!currentQuiz) return;

        let correct = 0;
        currentQuiz.questions.forEach((q, i) => {
          if (currentQuiz.answers[i] === q.correctAnswer) {
            correct++;
          }
        });

        const score = Math.round((correct / currentQuiz.totalQuestions) * 100);

        const completedQuiz: Quiz = {
          ...currentQuiz,
          score,
          completed: true,
          timeTaken: Date.now() - currentQuiz.createdAt.getTime(),
        };

        set((state) => ({
          currentQuiz: null,
          quizHistory: [...state.quizHistory, completedQuiz],
          currentPage: "dashboard",
        }));

        // Update topic ability
        if (currentQuiz.topicId) {
          get().updateTopicAbility(currentQuiz.topicId, score);
        }

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

// Helper function to generate questions
function generateQuestions(
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
