// PROPELLA - JAMB AI Tutor Types

export type PersonalityType = 'rapper' | 'football' | 'storyteller' | 'coach' | 'mentor';
export type LearningFormat = 'text' | 'audio' | 'video' | 'mixed';
export type VoicePreference = 'male' | 'female';
export type AbilityLevel = 'critical' | 'weak' | 'moderate' | 'strong';
export type TaskType = 'study' | 'quiz' | 'revision' | 'flashcard' | 'assignment' | 'reinforcement';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface User {
  id: string;
  nickname: string;
  subjects: Subject[];
  examDate: Date;
  dailyStudyHours: number;
  learningFormat: LearningFormat;
  personality: PersonalityType;
  voicePreference: VoicePreference;
  onboardingComplete: boolean;
  createdAt: Date;
  streak: number;
  lastStudyDate: Date | null;
  totalPoints: number;
  level: number;
  rank: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  icon: string;
  topics: Topic[];
  color: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  syllabusArea: string;
  abilityScore: number;
  abilityLevel: AbilityLevel;
  questionsAttempted: number;
  questionsCorrect: number;
  lastStudied: Date | null;
  masteryProgress: number;
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  year: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface Quiz {
  id: string;
  userId: string;
  subjectId: string;
  topicId: string | null;
  questions: Question[];
  answers: number[];
  score: number;
  totalQuestions: number;
  timeTaken: number;
  completed: boolean;
  createdAt: Date;
  type: 'diagnostic' | 'daily' | 'reinforcement' | 'challenge';
}

export interface RoadmapDay {
  id: string;
  userId: string;
  date: Date;
  dayNumber: number;
  tasks: Task[];
  isUnlocked: boolean;
  isCompleted: boolean;
  quizRequired: boolean;
  quizCompleted: boolean;
  quizScore: number | null;
  minimumMasteryRequired: number;
  estimatedHours: number;
}

export interface Task {
  id: string;
  dayId: string;
  type: TaskType;
  title: string;
  description: string;
  subjectId: string;
  topicId: string;
  duration: number;
  status: TaskStatus;
  order: number;
  resources: Resource[];
}

export interface Resource {
  id: string;
  type: 'video' | 'article' | 'pdf' | 'flashcard' | 'link';
  title: string;
  url: string;
  duration?: number;
}

export interface Assignment {
  id: string;
  userId: string;
  title: string;
  description: string;
  subjectId: string;
  topicId: string;
  type: TaskType;
  assignedBy: 'ai' | 'system';
  assignedAt: Date;
  dueDate: Date;
  completedAt: Date | null;
  status: TaskStatus;
  points: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  unlockedAt: Date | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  subjectId: string;
  topicId: string;
  activity: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  type: 'text' | 'explanation' | 'song' | 'flashcard' | 'diagram';
  metadata?: {
    topicId?: string;
    subjectId?: string;
    flashcards?: Flashcard[];
  };
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topicId: string;
  subjectId: string;
}

export interface PersonalityConfig {
  type: PersonalityType;
  name: string;
  avatar: string;
  greeting: string;
  encouragement: string[];
  challenge: string[];
  humor: string[];
  metaphors: string[];
  tone: 'energetic' | 'calm' | 'strict' | 'playful';
  speechPattern: string;
}

export interface DiagnosticResult {
  subjectId: string;
  topicScores: Record<string, number>;
  overallScore: number;
  abilityLevel: AbilityLevel;
  weakTopics: string[];
  strongTopics: string[];
}

export interface GamificationStats {
  points: number;
  level: number;
  streak: number;
  longestStreak: number;
  totalStudyTime: number;
  quizzesCompleted: number;
  averageScore: number;
  badges: Badge[];
  rank: string;
  nextLevelPoints: number;
}

export const RANKS = [
  { name: 'Rookie', minPoints: 0, color: '#9CA3AF' },
  { name: 'Scholar', minPoints: 500, color: '#3B82F6' },
  { name: 'Prodigy', minPoints: 1500, color: '#8B5CF6' },
  { name: 'Expert', minPoints: 3000, color: '#F59E0B' },
  { name: 'Master', minPoints: 5000, color: '#EF4444' },
  { name: 'Legend', minPoints: 8000, color: '#CCFF00' },
];

export const PERSONALITIES: Record<PersonalityType, PersonalityConfig> = {
  rapper: {
    type: 'rapper',
    name: 'MC Flow',
    avatar: '🎤',
    greeting: "Yo yo yo! Let's drop some knowledge beats! 🎵",
    encouragement: [
      "You're spittin' fire! Keep that flow going! 🔥",
      "Bars! Pure bars! You got this! 💯",
      "Rhyme and reason, you're in season! 🌟"
    ],
    challenge: [
      "Time to freestyle on these questions!",
      "Drop that knowledge like it's hot!",
      "Can you hit that high note of 100%?"
    ],
    humor: [
      "That answer was so wrong, it needs a remix! 😅",
      "Even my grandma spits better rhymes than that answer! 👵"
    ],
    metaphors: [
      "Knowledge is the beat, you're the DJ!",
      "Study like you're recording a hit album!"
    ],
    tone: 'energetic',
    speechPattern: 'rhyming'
  },
  football: {
    type: 'football',
    name: 'Coach Victor',
    avatar: '⚽',
    greeting: "Alright team! Let's get out there and win this! 🏆",
    encouragement: [
      "That's what I'm talking about! Championship mindset! 💪",
      "You're playing like a pro out there!",
      "MVP performance! Keep it up!"
    ],
    challenge: [
      "Time for the final play! Make it count!",
      "Can you score that winning goal?",
      "Defense! Defense! Lock in those answers!"
    ],
    humor: [
      "That answer was more offside than my uncle's BBQ! 😂",
      "You just got carded... with a yellow card of learning! 🟨"
    ],
    metaphors: [
      "Study like it's the World Cup final!",
      "Every topic is a position to master!"
    ],
    tone: 'energetic',
    speechPattern: 'coaching'
  },
  storyteller: {
    type: 'storyteller',
    name: 'Nana Aisha',
    avatar: '📚',
    greeting: "Gather round, let me tell you a tale of wisdom... 🌙",
    encouragement: [
      "Your story is being written with every correct answer! ✨",
      "You're becoming the hero of your own legend!",
      "The scrolls of knowledge are opening to you!"
    ],
    challenge: [
      "Will our hero conquer this challenge?",
      "The plot thickens... can you solve the mystery?",
      "Turn the page to your next adventure!"
    ],
    humor: [
      "Once upon a time... someone gave a wrong answer. It was you! 😄",
      "That answer belongs in a comedy, not a textbook!"
    ],
    metaphors: [
      "Every chapter brings you closer to the ending you desire!",
      "Knowledge is the greatest story ever told!"
    ],
    tone: 'calm',
    speechPattern: 'narrative'
  },
  coach: {
    type: 'coach',
    name: 'Sergeant Drill',
    avatar: '🎖️',
    greeting: "Drop and give me 20... questions! Let's go! 🫡",
    encouragement: [
      "Outstanding! You're a lean, mean, learning machine! 💪",
      "Discipline! Precision! Excellence! That's you!",
      "Mission accomplished, soldier!"
    ],
    challenge: [
      "No pain, no gain! Push through!",
      "Can you handle the heat? Prove it!",
      "This is your final test. Don't crack under pressure!"
    ],
    humor: [
      "That answer was so weak, it needs basic training! 😤",
      "My grandmother does push-ups better than you answer questions!"
    ],
    metaphors: [
      "Study like your life depends on it!",
      "Every topic is a battlefield to conquer!"
    ],
    tone: 'strict',
    speechPattern: 'commanding'
  },
  mentor: {
    type: 'mentor',
    name: 'Professor Wisdom',
    avatar: '🦉',
    greeting: "Welcome, young scholar. The journey of wisdom begins with a single step. 🌟",
    encouragement: [
      "Your growth is remarkable. Keep nurturing your mind! 🌱",
      "Wisdom is dawning upon you like the morning sun.",
      "You are transforming potential into excellence."
    ],
    challenge: [
      "The path is steep, but the view from the top is worth it.",
      "Challenge yourself, for that is how diamonds are formed.",
      "Can you rise to meet your highest potential?"
    ],
    humor: [
      "Even Socrates had off days. Let's try again! 😊",
      "That answer was... creatively incorrect!"
    ],
    metaphors: [
      "Knowledge is a garden that needs daily tending.",
      "You are the architect of your own understanding."
    ],
    tone: 'calm',
    speechPattern: 'philosophical'
  }
};

export const JAMB_SUBJECTS: Subject[] = [
  {
    id: 'english',
    name: 'English Language',
    code: 'ENG',
    icon: '📖',
    color: '#3B82F6',
    topics: [
      { id: 'eng_1', subjectId: 'english', name: 'Comprehension', syllabusArea: 'Reading', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'eng_2', subjectId: 'english', name: 'Summary', syllabusArea: 'Writing', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'eng_3', subjectId: 'english', name: 'Lexis and Structure', syllabusArea: 'Grammar', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'eng_4', subjectId: 'english', name: 'Oral Forms', syllabusArea: 'Phonology', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'eng_5', subjectId: 'english', name: 'Essay Writing', syllabusArea: 'Composition', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'eng_6', subjectId: 'english', name: 'Literature', syllabusArea: 'Literature', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'eng_7', subjectId: 'english', name: 'Antonyms and Synonyms', syllabusArea: 'Vocabulary', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'eng_8', subjectId: 'english', name: 'Idioms and Figures of Speech', syllabusArea: 'Expression', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'eng_9', subjectId: 'english', name: 'Sentence Interpretation', syllabusArea: 'Comprehension', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'eng_10', subjectId: 'english', name: 'Word Substitution', syllabusArea: 'Vocabulary', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
    ]
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    code: 'MATH',
    icon: '🔢',
    color: '#EF4444',
    topics: [
      { id: 'math_1', subjectId: 'mathematics', name: 'Algebra', syllabusArea: 'Number & Algebra', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'math_2', subjectId: 'mathematics', name: 'Geometry', syllabusArea: 'Geometry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'math_3', subjectId: 'mathematics', name: 'Trigonometry', syllabusArea: 'Geometry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'math_4', subjectId: 'mathematics', name: 'Calculus', syllabusArea: 'Calculus', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'math_5', subjectId: 'mathematics', name: 'Statistics', syllabusArea: 'Statistics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'math_6', subjectId: 'mathematics', name: 'Probability', syllabusArea: 'Statistics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'math_7', subjectId: 'mathematics', name: 'Coordinate Geometry', syllabusArea: 'Geometry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'math_8', subjectId: 'mathematics', name: 'Vectors', syllabusArea: 'Geometry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'math_9', subjectId: 'mathematics', name: 'Matrices', syllabusArea: 'Algebra', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'math_10', subjectId: 'mathematics', name: 'Sets', syllabusArea: 'Number & Algebra', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
    ]
  },
  {
    id: 'physics',
    name: 'Physics',
    code: 'PHY',
    icon: '⚛️',
    color: '#8B5CF6',
    topics: [
      { id: 'phy_1', subjectId: 'physics', name: 'Mechanics', syllabusArea: 'Mechanics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'phy_2', subjectId: 'physics', name: 'Heat and Thermodynamics', syllabusArea: 'Heat', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'phy_3', subjectId: 'physics', name: 'Waves', syllabusArea: 'Waves', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'phy_4', subjectId: 'physics', name: 'Optics', syllabusArea: 'Optics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'phy_5', subjectId: 'physics', name: 'Electricity', syllabusArea: 'Electricity', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'phy_6', subjectId: 'physics', name: 'Magnetism', syllabusArea: 'Magnetism', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'phy_7', subjectId: 'physics', name: 'Modern Physics', syllabusArea: 'Modern Physics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'phy_8', subjectId: 'physics', name: 'Measurement', syllabusArea: 'Measurement', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'phy_9', subjectId: 'physics', name: 'Simple Harmonic Motion', syllabusArea: 'Mechanics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'phy_10', subjectId: 'physics', name: 'Electronics', syllabusArea: 'Electronics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
    ]
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    code: 'CHEM',
    icon: '⚗️',
    color: '#10B981',
    topics: [
      { id: 'chem_1', subjectId: 'chemistry', name: 'Atomic Structure', syllabusArea: 'Physical Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'chem_2', subjectId: 'chemistry', name: 'Periodic Table', syllabusArea: 'Inorganic Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'chem_3', subjectId: 'chemistry', name: 'Chemical Bonding', syllabusArea: 'Physical Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'chem_4', subjectId: 'chemistry', name: 'Stoichiometry', syllabusArea: 'Physical Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'chem_5', subjectId: 'chemistry', name: 'Acids, Bases and Salts', syllabusArea: 'Inorganic Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'chem_6', subjectId: 'chemistry', name: 'Redox Reactions', syllabusArea: 'Physical Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'chem_7', subjectId: 'chemistry', name: 'Organic Chemistry', syllabusArea: 'Organic Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'chem_8', subjectId: 'chemistry', name: 'Electrochemistry', syllabusArea: 'Physical Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'chem_9', subjectId: 'chemistry', name: 'Chemical Equilibrium', syllabusArea: 'Physical Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'chem_10', subjectId: 'chemistry', name: 'Qualitative Analysis', syllabusArea: 'Analytical Chemistry', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
    ]
  },
  {
    id: 'biology',
    name: 'Biology',
    code: 'BIO',
    icon: '🧬',
    color: '#F59E0B',
    topics: [
      { id: 'bio_1', subjectId: 'biology', name: 'Cell Biology', syllabusArea: 'Cell', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'bio_2', subjectId: 'biology', name: 'Genetics', syllabusArea: 'Genetics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'bio_3', subjectId: 'biology', name: 'Ecology', syllabusArea: 'Ecology', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'bio_4', subjectId: 'biology', name: 'Evolution', syllabusArea: 'Evolution', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'bio_5', subjectId: 'biology', name: 'Human Physiology', syllabusArea: 'Physiology', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'bio_6', subjectId: 'biology', name: 'Plant Physiology', syllabusArea: 'Botany', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'bio_7', subjectId: 'biology', name: 'Microbiology', syllabusArea: 'Microbiology', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'bio_8', subjectId: 'biology', name: 'Reproduction', syllabusArea: 'Physiology', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'bio_9', subjectId: 'biology', name: 'Classification', syllabusArea: 'Taxonomy', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'bio_10', subjectId: 'biology', name: 'Transport Systems', syllabusArea: 'Physiology', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
    ]
  },
  {
    id: 'government',
    name: 'Government',
    code: 'GOVT',
    icon: '🏛️',
    color: '#6366F1',
    topics: [
      { id: 'govt_1', subjectId: 'government', name: 'Political Systems', syllabusArea: 'Political Concepts', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'govt_2', subjectId: 'government', name: 'Constitution', syllabusArea: 'Constitutionalism', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'govt_3', subjectId: 'government', name: 'Nigerian Government', syllabusArea: 'Nigerian Politics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'govt_4', subjectId: 'government', name: 'Foreign Policy', syllabusArea: 'International Relations', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'govt_5', subjectId: 'government', name: 'International Organizations', syllabusArea: 'International Relations', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'govt_6', subjectId: 'government', name: 'Local Government', syllabusArea: 'Nigerian Politics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'govt_7', subjectId: 'government', name: 'Political Ideologies', syllabusArea: 'Political Concepts', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'govt_8', subjectId: 'government', name: 'Elections and Electoral Systems', syllabusArea: 'Political Processes', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'govt_9', subjectId: 'government', name: 'Pre-colonial Political Systems', syllabusArea: 'African Politics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'govt_10', subjectId: 'government', name: 'Colonial Administration', syllabusArea: 'African Politics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
    ]
  },
  {
    id: 'economics',
    name: 'Economics',
    code: 'ECON',
    icon: '📈',
    color: '#EC4899',
    topics: [
      { id: 'econ_1', subjectId: 'economics', name: 'Basic Concepts', syllabusArea: 'Introduction', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'econ_2', subjectId: 'economics', name: 'Supply and Demand', syllabusArea: 'Microeconomics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'econ_3', subjectId: 'economics', name: 'Market Structures', syllabusArea: 'Microeconomics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'econ_4', subjectId: 'economics', name: 'National Income', syllabusArea: 'Macroeconomics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'econ_5', subjectId: 'economics', name: 'Money and Banking', syllabusArea: 'Macroeconomics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'econ_6', subjectId: 'economics', name: 'International Trade', syllabusArea: 'International Economics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'econ_7', subjectId: 'economics', name: 'Economic Development', syllabusArea: 'Development Economics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'econ_8', subjectId: 'economics', name: 'Public Finance', syllabusArea: 'Fiscal Policy', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'econ_9', subjectId: 'economics', name: 'Population', syllabusArea: 'Demography', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'econ_10', subjectId: 'economics', name: 'Agriculture', syllabusArea: 'Sectoral Economics', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
    ]
  },
  {
    id: 'literature',
    name: 'Literature in English',
    code: 'LIT',
    icon: '🎭',
    color: '#F97316',
    topics: [
      { id: 'lit_1', subjectId: 'literature', name: 'Drama', syllabusArea: 'Genres', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'lit_2', subjectId: 'literature', name: 'Prose', syllabusArea: 'Genres', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'lit_3', subjectId: 'literature', name: 'Poetry', syllabusArea: 'Genres', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'lit_4', subjectId: 'literature', name: 'Literary Terms', syllabusArea: 'Appreciation', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'lit_5', subjectId: 'literature', name: 'Figures of Speech', syllabusArea: 'Appreciation', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'lit_6', subjectId: 'literature', name: 'African Drama', syllabusArea: 'African Literature', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'lit_7', subjectId: 'literature', name: 'African Prose', syllabusArea: 'African Literature', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'lit_8', subjectId: 'literature', name: 'African Poetry', syllabusArea: 'African Literature', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'lit_9', subjectId: 'literature', name: 'Non-African Drama', syllabusArea: 'World Literature', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
      { id: 'lit_10', subjectId: 'literature', name: 'Non-African Prose', syllabusArea: 'World Literature', abilityScore: 0, abilityLevel: 'critical', questionsAttempted: 0, questionsCorrect: 0, lastStudied: null, masteryProgress: 0 },
    ]
  },
];

export const BADGES: Badge[] = [
  { id: 'badge_1', name: 'First Steps', description: 'Complete your first study session', icon: '👣', condition: 'first_session', rarity: 'common', unlockedAt: null },
  { id: 'badge_2', name: 'Streak Starter', description: 'Maintain a 3-day streak', icon: '🔥', condition: 'streak_3', rarity: 'common', unlockedAt: null },
  { id: 'badge_3', name: 'Streak Master', description: 'Maintain a 7-day streak', icon: '⚡', condition: 'streak_7', rarity: 'rare', unlockedAt: null },
  { id: 'badge_4', name: 'Streak Legend', description: 'Maintain a 30-day streak', icon: '🌟', condition: 'streak_30', rarity: 'legendary', unlockedAt: null },
  { id: 'badge_5', name: 'Quiz Whiz', description: 'Score 100% on any quiz', icon: '🎯', condition: 'perfect_quiz', rarity: 'rare', unlockedAt: null },
  { id: 'badge_6', name: 'Knowledge Seeker', description: 'Complete 50 quizzes', icon: '📚', condition: 'quizzes_50', rarity: 'rare', unlockedAt: null },
  { id: 'badge_7', name: 'Master Scholar', description: 'Reach Master rank', icon: '👑', condition: 'rank_master', rarity: 'epic', unlockedAt: null },
  { id: 'badge_8', name: 'Speed Demon', description: 'Complete a quiz in under 2 minutes', icon: '⚡', condition: 'speed_quiz', rarity: 'rare', unlockedAt: null },
  { id: 'badge_9', name: 'Comeback Kid', description: 'Recover from a broken streak', icon: '🔄', condition: 'streak_recovery', rarity: 'common', unlockedAt: null },
  { id: 'badge_10', name: 'Subject Expert', description: 'Reach 90% mastery in any subject', icon: '🎓', condition: 'subject_master', rarity: 'epic', unlockedAt: null },
];
