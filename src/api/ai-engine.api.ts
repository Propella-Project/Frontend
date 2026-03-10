import axios from "axios";
import type { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import { ENV } from "@/config/env";

// AI Engine API Client
export const aiEngineClient: AxiosInstance = axios.create({
  baseURL: ENV.AI_ENGINE_BASE_URL,
  timeout: ENV.AI_ENGINE_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": ENV.AI_ENGINE_API_KEY,
  },
});

// Response interceptor for error handling
aiEngineClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (!error.response) {
      console.error("AI Engine Network error - no response from server");
    } else {
      console.error("AI Engine API Error:", error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

// ==========================================
// QUIZ TYPES
// ==========================================

export interface QuizQuestion {
  subject: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  allocated_time: number;
}

export interface QuizGenerateRequest {
  subjects: string[];  // AI Engine expects 'subjects' as an array of strings
  topic: string;  // Required by AI Engine
  difficulty?: "easy" | "medium" | "hard";
  number_of_questions?: number;
}

export interface QuizGenerateResponse {
  questions: QuizQuestion[];
}

// ==========================================
// CHAT TYPES
// ==========================================

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
  type?: "text" | "image" | "code";
}

export interface SendMessageRequest {
  message: string;
  chat_id?: string | null;
  tutor_personality?: "mc_flow" | "coach_victor" | "nana_aisha" | "sergeant_drill" | "professor_wisdom" | null;
  use_rag?: boolean;
}

export interface SendMessageResponse {
  chat_id: string;
  reply: string;
  messages: ChatMessage[];
}

// ==========================================
// ROADMAP TYPES
// ==========================================

export interface RoadmapGenerateRequest {
  subjects: string[];
  exam_date: string;
  goal?: string;
  quiz_result?: Array<{
    subject: string;
    question: string;
    options: string[];
    correct_answer: string;
    allocated_time?: number;
  }>;
}

export interface RoadmapPhase {
  order: number;
  title: string;
  description: string;
}

export interface RoadmapGenerateResponse {
  phases: RoadmapPhase[];
}

// ==========================================
// STUDY PLAN TYPES
// ==========================================

export interface StudyPlanRequest {
  student_id: string;
  subjects: string[];
  exam_date: string;
  daily_study_hours: number;
}

export interface StudyPlanTopic {
  [key: string]: unknown;
}

export interface StudyPlanDay {
  day: number;
  date: string;
  topics: StudyPlanTopic[];
}

export interface StudyPlanResponse {
  exam_date: string;
  days_remaining: number;
  schedule: StudyPlanDay[];
}

// ==========================================
// TUTOR EXPLAIN TYPES
// ==========================================

export interface TutorExplainRequest {
  subject: string;
  topic: string;
  subtopic?: string;
  student_level?: "beginner" | "intermediate" | "advanced";
}

export interface TutorExplainResponse {
  explanation: string;
  worked_example: string;
  practice_question: string;
}

// ==========================================
// PROGRESS TYPES
// ==========================================

export interface ProgressUpdateRequest {
  student_id: string;
  subject: string;
  topic: string;
  mastery_score: number;
}

export interface ProgressTopic {
  topic: string;
  mastery_score: number;
  last_studied_at: string;
}

export interface ProgressResponse {
  subject: string;
  topics: ProgressTopic[];
}

// ==========================================
// STUDY RECOMMENDATION TYPES
// ==========================================

export interface StudyRecommendationResponse {
  subject: string;
  recommended_topics: string[];
  reason: string;
}

// ==========================================
// STUDY TIP TYPES
// ==========================================

export interface StudyTipResponse {
  tip: string;
}

// ==========================================
// SYLLABUS TYPES
// ==========================================

export interface SyllabusResponse {
  syllabus: string;
}

export interface TopicsResponse {
  subject: string;
  topics: string[];
}

export interface SubtopicsResponse {
  subject: string;
  topic: string;
  subtopics: string[];
}

// ==========================================
// AI ENGINE API FUNCTIONS
// ==========================================

export const aiEngineApi = {
  // ========== Quiz Generation ==========
  generateQuiz: async (
    request: QuizGenerateRequest
  ): Promise<QuizGenerateResponse> => {
    console.log("[AI Engine] Generating quiz:", JSON.stringify(request, null, 2));
    try {
      const response = await aiEngineClient.post<QuizGenerateResponse>(
        "/quiz/generate",
        request
      );
      
      // Validate response structure
      const data = response.data;
      console.log("[AI Engine] Raw quiz response:", JSON.stringify(data, null, 2));
      console.log("[AI Engine] Response type:", typeof data);
      console.log("[AI Engine] Response keys:", Object.keys(data || {}));
      
      // Handle different response formats
      let questions: QuizQuestion[] = [];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = data as any;
      
      if (Array.isArray(rawData)) {
        // Response is directly an array of questions
        console.log("[AI Engine] Response is array with", rawData.length, "items");
        questions = rawData;
      } else if (rawData.questions && Array.isArray(rawData.questions)) {
        // Response has questions property
        console.log("[AI Engine] Response has questions array with", rawData.questions.length, "items");
        questions = rawData.questions;
      } else if (rawData.data && Array.isArray(rawData.data)) {
        // Response is nested under data property
        console.log("[AI Engine] Response has nested data array with", rawData.data.length, "items");
        questions = rawData.data;
      } else {
        console.error("[AI Engine] Unexpected response format:", rawData);
        console.error("[AI Engine] Expected array or object with questions/data property");
        throw new Error("Invalid response format from AI Engine");
      }
      
      // Validate each question has required fields (with lenient validation)
      const validQuestions = questions.filter((q, idx) => {
        const hasQuestion = q.question && typeof q.question === 'string' && q.question.trim() !== '';
        const hasOptions = Array.isArray(q.options) && q.options.length >= 2;
        const hasCorrectAnswer = q.correct_answer !== undefined && q.correct_answer !== null;
        
        if (!hasQuestion) {
          console.warn(`[AI Engine] Question ${idx} missing valid question text:`, q);
        }
        if (!hasOptions) {
          console.warn(`[AI Engine] Question ${idx} missing valid options:`, q);
        }
        if (!hasCorrectAnswer) {
          console.warn(`[AI Engine] Question ${idx} missing correct_answer:`, q);
        }
        
        return hasQuestion && hasOptions && hasCorrectAnswer;
      });
      
      console.log(`[AI Engine] Valid questions: ${validQuestions.length}/${questions.length}`);
      
      if (validQuestions.length === 0) {
        console.error("[AI Engine] All questions failed validation. Sample question:", questions[0]);
        throw new Error("No valid questions in AI Engine response");
      }
      
      return { questions: validQuestions };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("[AI Engine] Quiz generation failed:", axiosError.message);
      if (axiosError.response?.status === 422) {
        console.error("[AI Engine] Validation error:", JSON.stringify(axiosError.response?.data, null, 2));
      }
      throw error;
    }
  },

  // ========== Chat ==========
  sendMessage: async (
    request: SendMessageRequest
  ): Promise<SendMessageResponse> => {
    const response = await aiEngineClient.post<SendMessageResponse>(
      "/chat",
      request
    );
    return response.data;
  },

  // ========== Roadmap Generation ==========
  generateRoadmap: async (
    request: RoadmapGenerateRequest
  ): Promise<RoadmapGenerateResponse> => {
    const response = await aiEngineClient.post<RoadmapGenerateResponse>(
      "/study/roadmap",
      request
    );
    return response.data;
  },

  // ========== Study Plan ==========
  generateStudyPlan: async (
    request: StudyPlanRequest
  ): Promise<StudyPlanResponse> => {
    const response = await aiEngineClient.post<StudyPlanResponse>(
      "/study/plan",
      request
    );
    return response.data;
  },

  // ========== Tutor Explanation ==========
  explainTopic: async (
    request: TutorExplainRequest
  ): Promise<TutorExplainResponse> => {
    const response = await aiEngineClient.post<TutorExplainResponse>(
      "/tutor/explain",
      request
    );
    return response.data;
  },

  // ========== Progress ==========
  updateProgress: async (
    request: ProgressUpdateRequest
  ): Promise<{ message: string }> => {
    try {
      // Validate request before sending
      if (!request.student_id || !request.subject || !request.topic || request.mastery_score === undefined) {
        console.warn("[AI Engine] Invalid progress update request:", request);
        return { message: "Invalid request - skipping" };
      }
      
      // Ensure all fields are properly formatted
      const payload = {
        student_id: String(request.student_id),
        subject: String(request.subject),
        topic: String(request.topic),
        mastery_score: Number(request.mastery_score),
      };
      
      console.log("[AI Engine] Sending progress update:", JSON.stringify(payload, null, 2));
      
      const response = await aiEngineClient.post<{ message: string }>(
        "/progress/update",
        payload
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 422) {
        console.warn("[AI Engine] Progress update validation error:", 
          JSON.stringify(axiosError.response?.data, null, 2));
      } else if (axiosError.response?.status === 500) {
        console.warn("[AI Engine] Progress update server error - student may not exist in AI Engine");
      } else {
        console.warn("[AI Engine] Progress update failed:", axiosError.message);
      }
      throw error; // Re-throw so caller can handle
    }
  },

  getProgress: async (
    studentId: string,
    subject: string
  ): Promise<ProgressResponse> => {
    try {
      const encodedStudentId = encodeURIComponent(String(studentId));
      const encodedSubject = encodeURIComponent(String(subject));
      const url = `/progress/${encodedStudentId}/${encodedSubject}`;
      
      console.log("[AI Engine] Fetching progress:", url);
      
      const response = await aiEngineClient.get<ProgressResponse>(url);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 500) {
        console.warn(`[AI Engine] Student "${studentId}" may not be registered in AI Engine`);
      }
      throw error;
    }
  },

  // ========== Study Recommendations ==========
  getStudyRecommendation: async (
    studentId: string,
    subject: string
  ): Promise<StudyRecommendationResponse> => {
    const response = await aiEngineClient.get<StudyRecommendationResponse>(
      `/study/recommendation/${studentId}/${subject}`
    );
    return response.data;
  },

  // ========== Study Tip ==========
  getStudyTip: async (
    subject: string,
    topic: string
  ): Promise<string> => {
    const response = await aiEngineClient.get<string>(
      `/study/tip?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`
    );
    return response.data;
  },

  // ========== Syllabus ==========
  getSyllabus: async (subject: string): Promise<string> => {
    try {
      const response = await aiEngineClient.get<string>(`/syllabus/${encodeURIComponent(subject)}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        console.warn(`[AI Engine] Syllabus not found for "${subject}" - using fallback`);
        return getFallbackSyllabus(subject);
      }
      throw error;
    }
  },

  getTopics: async (subject: string): Promise<string[]> => {
    try {
      const response = await aiEngineClient.get<TopicsResponse>(`/topics/${encodeURIComponent(subject)}`);
      // Return topics array, or fallback if empty
      if (response.data.topics && response.data.topics.length > 0) {
        return response.data.topics;
      }
      console.warn(`[AI Engine] No topics found for "${subject}" - using fallback`);
      return getFallbackTopics(subject);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        console.warn(`[AI Engine] Topics not found for "${subject}" - using fallback`);
      } else {
        console.warn(`[AI Engine] Failed to get topics for "${subject}" - using fallback`);
      }
      return getFallbackTopics(subject);
    }
  },

  getSubtopics: async (subject: string, topicName: string): Promise<string[]> => {
    try {
      const response = await aiEngineClient.get<SubtopicsResponse>(
        `/subtopics/${encodeURIComponent(subject)}/${encodeURIComponent(topicName)}`
      );
      // Return subtopics array, or fallback if empty
      if (response.data.subtopics && response.data.subtopics.length > 0) {
        return response.data.subtopics;
      }
      console.warn(`[AI Engine] No subtopics found for "${subject}/${topicName}" - using fallback`);
      return getFallbackSubtopics(subject, topicName);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        console.warn(`[AI Engine] Subtopics not found for "${subject}/${topicName}" - using fallback`);
      } else {
        console.warn(`[AI Engine] Failed to get subtopics for "${subject}/${topicName}" - using fallback`);
      }
      return getFallbackSubtopics(subject, topicName);
    }
  },

  // ========== Health Check ==========
  healthCheck: async (): Promise<{ status: string; version: string }> => {
    const response = await aiEngineClient.get<{ status: string; version: string }>("/health");
    return response.data;
  },
};

// ==========================================
// FALLBACK SYLLABUS DATA
// ==========================================

// JAMB Syllabus fallback data when AI Engine returns 404 or empty
function getFallbackSyllabus(subject: string): string {
  const syllabi: Record<string, string> = {
    english: `JAMB English Language Syllabus:
1. Comprehension/Summary
2. Lexis and Structure
3. Oral Forms

Topics include: reading comprehension, summary writing, vocabulary, grammar, phonetics, and essay writing.`,
    mathematics: `JAMB Mathematics Syllabus:
1. Number and Numeration
2. Algebra
3. Geometry/Trigonometry
4. Calculus
5. Statistics

Topics include: sets, number bases, fractions, decimals, indices, logarithms, surds, sequences, quadratic equations, geometry, trigonometry, differentiation, integration, and statistics.`,
    physics: `JAMB Physics Syllabus:
1. Measurement and Units
2.Scalars and Vectors
3. Motion
4. Equilibrium of Forces
5. Work, Energy and Power
6. Friction
7. Simple Machines
8. Elasticity
9. Pressure
10. Liquids at Rest
11. Temperature and its Measurement
12. Thermal Expansion
13. Gas Laws
14. Quantity of Heat
15. Change of State
16. Vapours
17. Structure of Matter and Kinetic Theory
18. Heat Transfer
19. Waves
20. Propagation of Sound Waves
21. Characteristics of Sound Waves
22. Light Energy
23. Reflection of Light at Plane and Curved Surfaces
24. Refraction of Light through Plane and Curved Surfaces
25. Optical Instruments
26. Electrostatics
27. Capacitors
28. Electric Cells
29. Current Electricity
30. Electrical Energy and Power
31. Magnets and Magnetic Fields
32. Force on a Current-Carrying Conductor
33. Electromagnetic Induction
34. Simple A.C. Circuits
35. Conduction of Electricity through Gases
36. Radioactivity
37. Energy and Society`,
    chemistry: `JAMB Chemistry Syllabus:
1. Separation of Mixtures and Purification of Chemical Substances
2. Chemical Combination
3. Kinetic Theory of Matter and Gas Laws
4. Atomic Structure and Bonding
5. Air
6. Water
7. Solubility
8. Environmental Pollution
9. Acids, Bases and Salts
10. Oxidation and Reduction
11. Electrolysis
12. Energy Changes
13. Rates of Chemical Reaction
14. Chemical Equilibria
15. Non-metals and their Compounds
16. Metals and their Compounds
17. Organic Compounds
18. Chemistry and Industry`,
    biology: `JAMB Biology Syllabus:
1. Variety of Organisms
2. Structure and Functions of Living Things
3. Life Processes in Living Things
4. Evolution
5. Ecosystem

Topics include: classification of organisms, cell biology, tissues and systems, nutrition, transport, respiration, excretion, reproduction, growth, regulation, heredity and variation, adaptation and evolution, and ecology.`,
  };
  
  const normalizedSubject = subject.toLowerCase().trim();
  return syllabi[normalizedSubject] || `${subject} syllabus content not available.`;
}

function getFallbackTopics(subject: string): string[] {
  const topics: Record<string, string[]> = {
    english: [
      "Comprehension",
      "Summary Writing",
      "Lexis and Structure",
      "Grammar",
      "Vocabulary",
      "Essay Writing",
      "Oral English",
      "Phonetics",
    ],
    mathematics: [
      "Number and Numeration",
      "Algebra",
      "Geometry",
      "Trigonometry",
      "Calculus",
      "Statistics",
      "Probability",
      "Vectors",
      "Matrices",
    ],
    physics: [
      "Measurement",
      "Motion",
      "Forces",
      "Work, Energy and Power",
      "Heat and Temperature",
      "Waves",
      "Light",
      "Electrostatics",
      "Current Electricity",
      "Magnetism",
      "Modern Physics",
    ],
    chemistry: [
      "Atomic Structure",
      "Chemical Bonding",
      "Stoichiometry",
      "Acids, Bases and Salts",
      "Redox Reactions",
      "Electrolysis",
      "Organic Chemistry",
      "Periodic Table",
      "Gas Laws",
    ],
    biology: [
      "Cell Biology",
      "Genetics",
      "Ecology",
      "Evolution",
      "Human Physiology",
      "Plant Physiology",
      "Microbiology",
      "Classification of Organisms",
    ],
  };
  
  const normalizedSubject = subject.toLowerCase().trim();
  return topics[normalizedSubject] || ["General", "Introduction", "Basics"];
}

function getFallbackSubtopics(subject: string, topicName: string): string[] {
  const subtopics: Record<string, Record<string, string[]>> = {
    english: {
      comprehension: ["Reading Techniques", "Inference", "Critical Analysis"],
      grammar: ["Parts of Speech", "Tenses", "Agreement", "Punctuation"],
      vocabulary: ["Synonyms", "Antonyms", "Word Formation", "Idioms"],
    },
    mathematics: {
      algebra: ["Equations", "Inequalities", "Polynomials", "Functions"],
      geometry: ["Angles", "Triangles", "Circles", "Coordinate Geometry"],
      calculus: ["Differentiation", "Integration", "Limits", "Applications"],
    },
    physics: {
      motion: ["Speed", "Velocity", "Acceleration", "Graphs of Motion"],
      waves: ["Wave Properties", "Sound Waves", "Light Waves", "Wave Interference"],
      "current electricity": ["Ohm's Law", "Circuits", "Resistance", "Power"],
    },
    chemistry: {
      "atomic structure": ["Protons", "Neutrons", "Electrons", "Isotopes"],
      "chemical bonding": ["Ionic", "Covalent", "Metallic", "Intermolecular"],
      "organic chemistry": ["Hydrocarbons", "Functional Groups", "Reactions"],
    },
    biology: {
      "cell biology": ["Cell Structure", "Cell Division", "Cell Transport"],
      genetics: ["DNA", "RNA", "Mendelian Genetics", "Mutations"],
      ecology: ["Ecosystems", "Food Chains", "Biogeochemical Cycles"],
    },
  };
  
  const normalizedSubject = subject.toLowerCase().trim();
  const normalizedTopic = topicName.toLowerCase().trim();
  
  return subtopics[normalizedSubject]?.[normalizedTopic] || 
         ["Introduction", "Basic Concepts", "Practice Problems"];
}

export default aiEngineApi;
