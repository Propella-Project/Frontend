import { aiQuizService } from "./aiQuiz.service";
import { getMixedTemplateQuestions } from "@/data/templateQuestions";
import { quizApi } from "@/api/quiz.api";
import type { Subject, Question } from "@/types";
import { FEATURES } from "@/config/env";

export interface DiagnosticQuizResult {
  questions: Question[];
  source: "ai" | "template" | "api";
  error?: string;
}

/**
 * Generate diagnostic quiz questions with fallback logic:
 * 1. Try AI Engine first (if enabled)
 * 2. Fall back to Backend API
 * 3. Fall back to Template questions
 */
export async function generateDiagnosticQuiz(
  subjects: Subject[],
  questionsPerSubject: number = 3
): Promise<DiagnosticQuizResult> {
  console.log("[DiagnosticQuiz] Generating quiz for subjects:", subjects.map(s => s.name));

  // Try AI Engine first (if enabled)
  if (FEATURES.ENABLE_AI_ENGINE) {
    try {
      console.log("[DiagnosticQuiz] Attempting AI Engine...");
      const aiQuestions = await aiQuizService.generateMixedAIQuestions(
        subjects,
        questionsPerSubject,
        "medium"
      );
      
      if (aiQuestions.length > 0) {
        console.log(`[DiagnosticQuiz] AI Engine returned ${aiQuestions.length} questions`);
        return {
          questions: aiQuestions,
          source: "ai",
        };
      }
    } catch (error) {
      console.warn("[DiagnosticQuiz] AI Engine failed:", error);
    }
  }

  // Try Backend API
  try {
    console.log("[DiagnosticQuiz] Attempting Backend API...");
    const apiQuestions: Question[] = [];
    
    // Fetch questions for each subject from API
    for (const subject of subjects) {
      try {
        const response = await quizApi.getDiagnosticQuiz(subject.name);
        // Convert API response to Question format
        const convertedQuestions = response.slice(0, questionsPerSubject).map((q, index) => ({
          id: `api_${subject.id}_${index}_${Date.now()}`,
          subjectId: subject.id,
          topicId: subject.topics[0]?.id || "general",
          year: new Date().getFullYear(),
          question: q.question,
          options: q.options,
          correctAnswer: q.options.indexOf(q.correct_answer),
          explanation: `The correct answer is ${q.correct_answer}`,
          difficulty: "medium" as const,
          topic: q.subject || "General",
        }));
        apiQuestions.push(...convertedQuestions);
      } catch (subjectError) {
        console.warn(`[DiagnosticQuiz] API failed for ${subject.name}:`, subjectError);
      }
    }

    if (apiQuestions.length > 0) {
      console.log(`[DiagnosticQuiz] Backend API returned ${apiQuestions.length} questions`);
      return {
        questions: apiQuestions,
        source: "api",
      };
    }
  } catch (error) {
    console.warn("[DiagnosticQuiz] Backend API failed:", error);
  }

  // Fall back to template questions
  console.log("[DiagnosticQuiz] Using template questions as fallback");
  const subjectIds = subjects.map(s => s.id);
  const templateQuestions = getMixedTemplateQuestions(subjectIds, questionsPerSubject);
  
  return {
    questions: templateQuestions,
    source: "template",
  };
}

/**
 * Generate diagnostic quiz with processing state
 * This function handles the loading state and returns results
 */
export async function generateDiagnosticQuizWithProcessing(
  subjects: Subject[],
  questionsPerSubject: number = 3,
  onProgress?: (progress: number) => void
): Promise<DiagnosticQuizResult> {
  // Simulate progress updates
  const progressInterval = setInterval(() => {
    onProgress?.(Math.floor(Math.random() * 30) + 10);
  }, 500);

  try {
    onProgress?.(10);
    
    const result = await generateDiagnosticQuiz(subjects, questionsPerSubject);
    
    onProgress?.(100);
    clearInterval(progressInterval);
    
    return result;
  } catch (error) {
    clearInterval(progressInterval);
    console.error("[DiagnosticQuiz] All sources failed:", error);
    
    // Ultimate fallback - return template questions
    const subjectIds = subjects.map(s => s.id);
    return {
      questions: getMixedTemplateQuestions(subjectIds, questionsPerSubject),
      source: "template",
      error: error instanceof Error ? error.message : "Failed to generate quiz",
    };
  }
}

export const diagnosticQuizService = {
  generateDiagnosticQuiz,
  generateDiagnosticQuizWithProcessing,
};

export default diagnosticQuizService;
