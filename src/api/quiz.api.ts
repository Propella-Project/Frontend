import apiClient from "./client";
import aiEngineApi from "./ai-engine.api";
import { ENDPOINTS } from "@/config/endpoints";
import type { 
  DiagnosticQuestion, 
  QuizResultsPayload,
} from "@/types/api.types";

// Default quiz configuration
const DEFAULT_QUIZ_CONFIG = {
  number_of_questions: 10,
  difficulty: "medium" as const,
};

export const quizApi = {
  // Get diagnostic quiz for a subject - POWERED BY AI ENGINE
  getDiagnosticQuiz: async (subject: string, topic?: string): Promise<DiagnosticQuestion[]> => {
    try {
      // Try AI Engine first for dynamic quiz generation
      // AI Engine requires topic field and uses 'subjects' (plural) as array
      const requestBody = {
        subjects: [subject],  // subjects must be an array
        topic: topic && topic.trim() !== "" ? topic : "General",
        difficulty: DEFAULT_QUIZ_CONFIG.difficulty,
        number_of_questions: DEFAULT_QUIZ_CONFIG.number_of_questions,
      };
      
      const aiResponse = await aiEngineApi.generateQuiz(requestBody);
      
      // Transform AI Engine response to match expected format
      return aiResponse.questions.map((q) => ({
        subject: q.subject,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        allocated_time: q.allocated_time || 60,
      }));
    } catch (aiError) {
      console.warn("[Quiz] AI Engine failed, using fallback:", aiError);
      
      // Fallback: Try backend API (response may be { questions: [...] } or array)
      try {
        const response = await apiClient.get(ENDPOINTS.diagnostic.getQuiz(subject));
        const data = response.data;
        const questions = Array.isArray(data) ? data : data?.questions ?? [];
        return questions;
      } catch (backendError) {
        console.warn("[Quiz] Backend failed, using local fallback");
        // Return AI-generated style fallback questions
        return generateFallbackQuestions(subject, topic);
      }
    }
  },

  // Submit quiz results - store in localStorage for now since backend may not have endpoint
  submitResults: async (payload: QuizResultsPayload): Promise<void> => {
    try {
      // Try to submit to backend
      const response = await apiClient.post(ENDPOINTS.diagnostic.submitResults, payload);
      
      // Also store locally for persistence
      storeQuizResultsLocally(payload);
      
      return response.data;
    } catch (error) {
      console.warn("[Quiz] Backend submit failed, storing locally");
      // Store results locally when backend is unavailable
      storeQuizResultsLocally(payload);
      
      // Update AI Engine with progress if possible
      try {
        const { results } = payload;
        const correct = results.filter(r => r.userAnswer === r.correctAnswer).length;
        const total = results.length;
        
        // Get user ID from store or localStorage
        const userId = localStorage.getItem("propella_user_id") || "anonymous";
        const subject = results[0]?.subject || "general";
        
        // Fire and forget - don't block on this
        aiEngineApi.updateProgress({
          student_id: userId,
          subject,
          topic: "diagnostic_quiz",
          mastery_score: Math.round((correct / total) * 100),
        }).catch((err) => {
          // Log but don't throw - progress update failure shouldn't break the app
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 422) {
            console.warn("[Quiz] AI Progress update validation error");
          } else if (status === 500) {
            console.warn("[Quiz] AI Progress update server error - student not registered");
          }
        });
      } catch {
        // Silent fail for progress update
      }
    }
  },
  
  // Generate practice quiz - ALWAYS uses AI Engine
  generatePracticeQuiz: async (
    subject: string, 
    topic: string, 
    difficulty: "easy" | "medium" | "hard" = "medium",
    questionCount: number = 5
  ): Promise<DiagnosticQuestion[]> => {
    const aiResponse = await aiEngineApi.generateQuiz({
      subjects: [subject],  // subjects must be an array
      topic: topic && topic.trim() !== "" ? topic : "General",
      difficulty,
      number_of_questions: questionCount,
    });
    
    return aiResponse.questions.map((q) => ({
      subject: q.subject,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      allocated_time: q.allocated_time || 60,
    }));
  },
};

// Helper to store quiz results in localStorage
function storeQuizResultsLocally(payload: QuizResultsPayload): void {
  const stored = localStorage.getItem("propella_quiz_history");
  const history = stored ? JSON.parse(stored) : [];
  
  history.push({
    id: `quiz_${Date.now()}`,
    timestamp: new Date().toISOString(),
    results: payload.results,
    summary: {
      total: payload.results.length,
      correct: payload.results.filter(r => r.userAnswer === r.correctAnswer).length,
      subject: payload.results[0]?.subject || "general",
    },
  });
  
  // Keep only last 50 quizzes
  if (history.length > 50) {
    history.shift();
  }
  
  localStorage.setItem("propella_quiz_history", JSON.stringify(history));
}

// Generate fallback questions when both AI and backend fail
function generateFallbackQuestions(subject: string, _topic?: string): DiagnosticQuestion[] {
  const subjects: Record<string, DiagnosticQuestion[]> = {
    mathematics: [
      {
        subject: "Mathematics",
        question: "What is the value of x in the equation 2x + 5 = 15?",
        options: ["3", "4", "5", "6"],
        correct_answer: "5",
        allocated_time: 60,
      },
      {
        subject: "Mathematics",
        question: "If a triangle has angles 60° and 70°, what is the third angle?",
        options: ["40°", "50°", "60°", "70°"],
        correct_answer: "50°",
        allocated_time: 60,
      },
      {
        subject: "Mathematics",
        question: "What is the square root of 144?",
        options: ["10", "11", "12", "13"],
        correct_answer: "12",
        allocated_time: 45,
      },
      {
        subject: "Mathematics",
        question: "Solve: 3(2x - 4) = 18",
        options: ["3", "4", "5", "6"],
        correct_answer: "5",
        allocated_time: 90,
      },
      {
        subject: "Mathematics",
        question: "What is 25% of 80?",
        options: ["15", "20", "25", "30"],
        correct_answer: "20",
        allocated_time: 45,
      },
    ],
    english: [
      {
        subject: "English",
        question: "Which word is a synonym for 'happy'?",
        options: ["Sad", "Joyful", "Angry", "Tired"],
        correct_answer: "Joyful",
        allocated_time: 30,
      },
      {
        subject: "English",
        question: "Choose the correct spelling:",
        options: ["Accomodate", "Accommodate", "Acommodate", "Acomodate"],
        correct_answer: "Accommodate",
        allocated_time: 45,
      },
      {
        subject: "English",
        question: "What is the past tense of 'run'?",
        options: ["Runned", "Ran", "Running", "Runs"],
        correct_answer: "Ran",
        allocated_time: 30,
      },
      {
        subject: "English",
        question: "Identify the noun in this sentence: 'The cat sat on the mat.'",
        options: ["sat", "on", "cat", "the"],
        correct_answer: "cat",
        allocated_time: 45,
      },
      {
        subject: "English",
        question: "Which punctuation mark ends an exclamatory sentence?",
        options: ["Period", "Comma", "Question mark", "Exclamation mark"],
        correct_answer: "Exclamation mark",
        allocated_time: 30,
      },
    ],
    physics: [
      {
        subject: "Physics",
        question: "What is the SI unit of force?",
        options: ["Watt", "Newton", "Joule", "Pascal"],
        correct_answer: "Newton",
        allocated_time: 45,
      },
      {
        subject: "Physics",
        question: "What is the speed of light in vacuum (approximate)?",
        options: ["3 × 10^8 m/s", "3 × 10^6 m/s", "3 × 10^10 m/s", "3 × 10^4 m/s"],
        correct_answer: "3 × 10^8 m/s",
        allocated_time: 60,
      },
      {
        subject: "Physics",
        question: "Which law states that energy cannot be created or destroyed?",
        options: ["Newton's First Law", "Law of Conservation of Energy", "Ohm's Law", " Boyle's Law"],
        correct_answer: "Law of Conservation of Energy",
        allocated_time: 60,
      },
      {
        subject: "Physics",
        question: "What is the formula for density?",
        options: ["mass × volume", "mass / volume", "volume / mass", "mass + volume"],
        correct_answer: "mass / volume",
        allocated_time: 45,
      },
      {
        subject: "Physics",
        question: "What type of wave is light?",
        options: ["Mechanical wave", "Transverse wave", "Longitudinal wave", "Sound wave"],
        correct_answer: "Transverse wave",
        allocated_time: 60,
      },
    ],
    chemistry: [
      {
        subject: "Chemistry",
        question: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Au", "Ag"],
        correct_answer: "Au",
        allocated_time: 30,
      },
      {
        subject: "Chemistry",
        question: "How many electrons are in a neutral atom of carbon?",
        options: ["4", "6", "8", "12"],
        correct_answer: "6",
        allocated_time: 45,
      },
      {
        subject: "Chemistry",
        question: "What is the pH of pure water at 25°C?",
        options: ["0", "7", "14", "10"],
        correct_answer: "7",
        allocated_time: 45,
      },
      {
        subject: "Chemistry",
        question: "Which gas makes up about 78% of Earth's atmosphere?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        correct_answer: "Nitrogen",
        allocated_time: 45,
      },
      {
        subject: "Chemistry",
        question: "What type of bond involves the sharing of electrons?",
        options: ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"],
        correct_answer: "Covalent bond",
        allocated_time: 60,
      },
    ],
    biology: [
      {
        subject: "Biology",
        question: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"],
        correct_answer: "Mitochondria",
        allocated_time: 45,
      },
      {
        subject: "Biology",
        question: "How many chromosomes do humans have?",
        options: ["23", "46", "48", "22"],
        correct_answer: "46",
        allocated_time: 45,
      },
      {
        subject: "Biology",
        question: "What is the process by which plants make their food?",
        options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
        correct_answer: "Photosynthesis",
        allocated_time: 45,
      },
      {
        subject: "Biology",
        question: "Which blood type is the universal donor?",
        options: ["A+", "B+", "AB+", "O-"],
        correct_answer: "O-",
        allocated_time: 60,
      },
      {
        subject: "Biology",
        question: "What is the largest organ in the human body?",
        options: ["Heart", "Liver", "Skin", "Brain"],
        correct_answer: "Skin",
        allocated_time: 60,
      },
    ],
  };
  
  // Return subject-specific questions or general questions
  const normalizedSubject = subject.toLowerCase();
  return subjects[normalizedSubject] || subjects.mathematics;
}

export default quizApi;
