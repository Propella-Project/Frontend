import { aiQuizService } from "./aiQuiz.service";
import { quizApi } from "@/api/quiz.api";
import type { Subject, Question } from "@/types";
import { FEATURES } from "@/config/env";

/**
 * Map API correct_answer (e.g. "A", "B", "C", "D") to 0-based option index.
 * Handles: single letter, option text like "C) Leaf", or options like ["A) Root", "B) Stem", ...].
 */
function getCorrectAnswerIndex(options: string[] | undefined, correctAnswer: string | undefined): number {
  if (!options?.length || correctAnswer == null || correctAnswer === "") return 0;
  const normalized = String(correctAnswer).trim().toUpperCase();
  const letter = normalized.charAt(0);
  // A=0, B=1, C=2, D=3
  if (letter >= "A" && letter <= "Z") {
    const index = letter.charCodeAt(0) - 65;
    if (index >= 0 && index < options.length) return index;
  }
  // Fallback: find option that starts with this letter (e.g. "C)" or "C) Leaf")
  const matchIndex = options.findIndex(
    (opt) => opt.trim().toUpperCase().startsWith(letter + ")") || opt.trim().toUpperCase().startsWith(letter + " ")
  );
  return matchIndex >= 0 ? matchIndex : 0;
}

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

  // Try Backend API – single POST: { subjects: user's selected subject names, topic: "any", difficulty, number_of_questions }
  try {
    console.log("[DiagnosticQuiz] Attempting Backend API (subjects array)...");
    const subjectNames = subjects.map((s) => s.name.toLowerCase().trim());
    const totalQuestions = questionsPerSubject * subjects.length;
    const response = await quizApi.generateDiagnosticQuiz({
      subjects: subjectNames,
      topic: "any",
      difficulty: "medium",
      number_of_questions: totalQuestions,
    });
    console.log(`[DiagnosticQuiz] API response: ${response?.length ?? 0} questions`);

    if (response?.length > 0) {
      const apiQuestions: Question[] = response.map((q, index) => {
        const subjectObj = subjects.find(
          (s) => s.name.toLowerCase() === (q.subject ?? "").toLowerCase()
        );
        const subjectId = subjectObj?.id ?? q.subject ?? "general";
        const topicId = subjectObj?.topics?.[0]?.id ?? "general";
        const correctIndex = getCorrectAnswerIndex(q.options, q.correct_answer);
        return {
          id: `api_${subjectId}_${index}_${Date.now()}`,
          subjectId,
          topicId,
          year: new Date().getFullYear(),
          question: q.question,
          options: q.options,
          correctAnswer: correctIndex,
          explanation: q.explanation ?? `The correct answer is ${q.correct_answer}`,
          difficulty: "medium" as const,
          topic: q.subject ?? "General",
        };
      });
      console.log(`[DiagnosticQuiz] Backend API returned ${apiQuestions.length} questions`);
      return {
        questions: apiQuestions,
        source: "api",
      };
    }
  } catch (error) {
    console.warn("[DiagnosticQuiz] Backend API failed:", error);
  }

  return {
    questions: [],
    source: "api",
    error: "Unable to load questions. Please try again.",
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
    return {
      questions: [],
      source: "api",
      error: error instanceof Error ? error.message : "Failed to generate quiz",
    };
  }
}

export const diagnosticQuizService = {
  generateDiagnosticQuiz,
  generateDiagnosticQuizWithProcessing,
};

export default diagnosticQuizService;
