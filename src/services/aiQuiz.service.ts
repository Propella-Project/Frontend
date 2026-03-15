import { aiEngineApi, type QuizQuestion } from "@/api/ai-engine.api";
import type { Subject, Question } from "@/types";
import { FEATURES } from "@/config/env";

// Convert AI Engine quiz question to app Question format
function convertAiQuestionToAppQuestion(
  aiQuestion: QuizQuestion,
  index: number,
  subjectId: string,
  topicId: string
): Question {
  // Find the index of the correct answer in the options array
  // Handle both string (option text) and number/letter (A, B, C, D or 0, 1, 2, 3) formats
  let correctAnswerIndex = -1;
  
  const correctAnswer = String(aiQuestion.correct_answer).trim();
  const normalizedCorrectAnswer = correctAnswer.toLowerCase();
  
  // Try to find by matching option text (case-insensitive)
  correctAnswerIndex = aiQuestion.options.findIndex(
    (opt) => opt.toLowerCase().trim() === normalizedCorrectAnswer
  );
  
  // If not found, check if correct_answer is a letter (A, B, C, D)
  if (correctAnswerIndex === -1) {
    const letterToIndex: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4 };
    if (normalizedCorrectAnswer in letterToIndex) {
      const letterIndex = letterToIndex[normalizedCorrectAnswer];
      if (letterIndex < aiQuestion.options.length) {
        correctAnswerIndex = letterIndex;
      }
    }
  }
  
  // If still not found, check if correct_answer is a number/index directly
  if (correctAnswerIndex === -1) {
    const numericIndex = parseInt(correctAnswer, 10);
    if (!isNaN(numericIndex) && numericIndex >= 0 && numericIndex < aiQuestion.options.length) {
      correctAnswerIndex = numericIndex;
    }
  }
  
  // Log warning if we couldn't find the correct answer
  if (correctAnswerIndex === -1) {
    // Default to 0 only as last resort, but this indicates a data issue
    correctAnswerIndex = 0;
  }

  return {
    id: `q_${Date.now()}_${index}`,
    subjectId: subjectId,
    topicId: topicId,
    year: new Date().getFullYear(),
    question: aiQuestion.question,
    options: aiQuestion.options,
    correctAnswer: correctAnswerIndex,
    explanation: aiQuestion.explanation || "",
    difficulty: "medium", // AI doesn't specify difficulty, default to medium
    topic: aiQuestion.subject || "General",
  };
}

// Generate questions using AI Engine
export async function generateAIQuestions(
  subject: Subject,
  topicId: string | null,
  count: number,
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<Question[]> {
  // Get topic name if topicId is provided
  const topic = topicId
    ? subject.topics.find((t) => t.id === topicId)
    : null;

  if (!FEATURES.ENABLE_AI_ENGINE) {
    return [];
  }

  try {
    // Call AI Engine API
    // Clean subject name - remove special characters
    const cleanSubject = subject.name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    // AI Engine requires topic - use first topic or subject name as fallback
    const topicName = topic?.name || subject.topics[0]?.name || "General";
    
    const response = await aiEngineApi.generateQuiz({
      subjects: [cleanSubject],  // subjects must be an array
      topic: topicName,
      difficulty: difficulty,
      number_of_questions: count,
    });

    // Convert AI questions to app format
    return response.questions.map((aiQ, index) =>
      convertAiQuestionToAppQuestion(
        aiQ,
        index,
        subject.id,
        topic?.id || subject.topics[0]?.id || ""
      )
    );
  } catch (error) {
    console.error("[AI Quiz] Failed to generate AI questions:", error);
    throw error;
  }
}

// Generate mixed questions from multiple subjects (for diagnostic quiz)
// AI Engine has a limit of 20 questions per request
export async function generateMixedAIQuestions(
  subjects: Subject[],
  questionsPerSubject: number = 5,
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<Question[]> {
  // Cap at AI Engine limit of 20
  const MAX_PER_REQUEST = 20;
  const cappedQuestionsPerSubject = Math.min(questionsPerSubject, MAX_PER_REQUEST);
  
  if (questionsPerSubject > MAX_PER_REQUEST) {
  }

  // Generate questions for each subject in parallel
  const promises = subjects.map(async (subject, subjectIndex) => {
    try {
      if (!FEATURES.ENABLE_AI_ENGINE) {
        return [];
      }
      
      // Clean subject name and get topic (required by AI Engine)
      const cleanSubject = subject.name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      const topicName = subject.topics[0]?.name || "General";
      
      const response = await aiEngineApi.generateQuiz({
        subjects: [cleanSubject],  // subjects must be an array
        topic: topicName,
        difficulty: difficulty,
        number_of_questions: cappedQuestionsPerSubject,
      });

      return response.questions.map((aiQ, qIndex) =>
        convertAiQuestionToAppQuestion(
          aiQ,
          subjectIndex * cappedQuestionsPerSubject + qIndex,
          subject.id,
          subject.topics[0]?.id || ""
        )
      );
    } catch (error) {
      console.error(`[AI Quiz] Failed to generate questions for ${subject.name}:`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);
  const allQuestions = results.flat();
  
  if (allQuestions.length === 0) {
    console.error("[AI Quiz] No questions generated from any source");
    throw new Error("Failed to generate any questions");
  }
  
  return allQuestions;
}

// Generate marathon mode questions (large set)
// AI Engine has a limit of 20 questions per request, so we batch if needed
export async function generateMarathonAIQuestions(
  subjects: Subject[],
  totalQuestions: number = 30,
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<Question[]> {
  // AI Engine limit is 20 questions per request
  const MAX_PER_REQUEST = 20;
  const questionsPerSubject = Math.ceil(totalQuestions / subjects.length);
  
  const allQuestions: Question[] = [];
  let failedBatches = 0;
  
  // For each subject, generate questions (in batches of 20 if needed)
  for (const subject of subjects) {
    if (allQuestions.length >= totalQuestions) break;
    
    let subjectQuestionsNeeded = Math.min(questionsPerSubject, totalQuestions - allQuestions.length);
    while (subjectQuestionsNeeded > 0) {
      const batchSize = Math.min(subjectQuestionsNeeded, MAX_PER_REQUEST);
      
      if (!FEATURES.ENABLE_AI_ENGINE) {
        break;
      }
      
      try {
        const response = await aiEngineApi.generateQuiz({
          subjects: [subject.name],  // subjects must be an array
          topic: subject.topics[0]?.name || "General",
          difficulty,
          number_of_questions: batchSize,
        });

        const convertedQuestions = response.questions.map((q, idx) => {
          // Find correct answer index - handle both string (option text/letter) and number formats
          let correctIndex = -1;
          const correctAnswer = String(q.correct_answer).trim();
          const normalizedCorrectAnswer = correctAnswer.toLowerCase();
          
          // First try to match by option text (case-insensitive, trimmed)
          if (q.options && q.options.length > 0) {
            correctIndex = q.options.findIndex(
              (opt) => opt.toLowerCase().trim() === normalizedCorrectAnswer
            );
            
            // If not found, try to match by letter (A=0, B=1, C=2, D=3, E=4)
            if (correctIndex === -1) {
              const letterToIndex: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4 };
              if (normalizedCorrectAnswer in letterToIndex) {
                const letterIdx = letterToIndex[normalizedCorrectAnswer];
                if (letterIdx < q.options.length) {
                  correctIndex = letterIdx;
                }
              }
            }
            
            // If still not found, try to parse as numeric index
            if (correctIndex === -1) {
              const numericIdx = parseInt(correctAnswer, 10);
              if (!isNaN(numericIdx) && numericIdx >= 0 && numericIdx < q.options.length) {
                correctIndex = numericIdx;
              }
            }
          }
          
          // Log warning and default to 0 only if we couldn't determine the correct answer
          if (correctIndex === -1) {
            correctIndex = 0;
          }
          
          return {
            id: `q_${subject.id}_${Date.now()}_${idx}`,
            subjectId: subject.id,
            topicId: subject.topics[0]?.id || "",
            year: new Date().getFullYear(),
            question: q.question,
            options: q.options,
            correctAnswer: correctIndex,
            explanation: q.explanation || `The correct answer is ${q.options[correctIndex] || q.correct_answer}`,
            difficulty: difficulty,
            topic: q.subject || subject.name,
          };
        });

        allQuestions.push(...convertedQuestions);
        subjectQuestionsNeeded -= batchSize;

        // Small delay between batches to avoid rate limiting
        if (subjectQuestionsNeeded > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch {
        failedBatches++;
        // Continue with next batch; no dummy fallback
      }
    }
  }

  // Shuffle and limit to exact count
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(totalQuestions, allQuestions.length));
}

export const aiQuizService = {
  generateAIQuestions,
  generateMixedAIQuestions,
  generateMarathonAIQuestions,
};

export default aiQuizService;
