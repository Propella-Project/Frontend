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
  const correctAnswerIndex = aiQuestion.options.findIndex(
    (opt) => opt.toLowerCase().trim() === aiQuestion.correct_answer.toLowerCase().trim()
  );

  return {
    id: `q_${Date.now()}_${index}`,
    subjectId: subjectId,
    topicId: topicId,
    year: new Date().getFullYear(),
    question: aiQuestion.question,
    options: aiQuestion.options,
    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
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
  if (!FEATURES.ENABLE_AI_ENGINE) {
    throw new Error("AI Engine is disabled");
  }

  try {
    // Get topic name if topicId is provided
    const topic = topicId
      ? subject.topics.find((t) => t.id === topicId)
      : null;

    // Call AI Engine API
    // Clean subject name - remove special characters
    const cleanSubject = subject.name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    // AI Engine requires topic - use first topic or subject name as fallback
    const topicName = topic?.name || subject.topics[0]?.name || "General";
    console.log(`[AI Quiz] Requesting ${count} questions for subject: "${cleanSubject}", topic: "${topicName}"`);
    
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
    console.error("Failed to generate AI questions:", error);
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
  if (!FEATURES.ENABLE_AI_ENGINE) {
    throw new Error("AI Engine is disabled");
  }

  // Cap at AI Engine limit of 20
  const MAX_PER_REQUEST = 20;
  const cappedQuestionsPerSubject = Math.min(questionsPerSubject, MAX_PER_REQUEST);
  
  if (questionsPerSubject > MAX_PER_REQUEST) {
    console.warn(`[AI Quiz] Requested ${questionsPerSubject} questions per subject, but AI Engine max is ${MAX_PER_REQUEST}. Capping.`);
  }

  try {
    // Generate questions for each subject in parallel
    const promises = subjects.map(async (subject, subjectIndex) => {
      try {
        // Clean subject name and get topic (required by AI Engine)
        const cleanSubject = subject.name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
        const topicName = subject.topics[0]?.name || "General";
        console.log(`[AI Quiz] Requesting ${cappedQuestionsPerSubject} questions for: "${cleanSubject}" / "${topicName}"`);
        
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
        console.error(`Failed to generate questions for ${subject.name}:`, error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error("Failed to generate mixed AI questions:", error);
    throw error;
  }
}

// Generate marathon mode questions (large set)
// AI Engine has a limit of 20 questions per request, so we batch if needed
export async function generateMarathonAIQuestions(
  subjects: Subject[],
  totalQuestions: number = 50,
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<Question[]> {
  if (!FEATURES.ENABLE_AI_ENGINE) {
    console.warn("[Marathon] AI Engine is disabled, using fallback");
    throw new Error("AI Engine is disabled");
  }

  // AI Engine limit is 20 questions per request
  const MAX_PER_REQUEST = 20;
  const questionsPerSubject = Math.ceil(totalQuestions / subjects.length);
  
  console.log(`[Marathon] Starting generation: ${totalQuestions} total, ${questionsPerSubject} per subject, ${subjects.length} subjects`);
  
  const allQuestions: Question[] = [];
  let failedBatches = 0;
  
  // For each subject, generate questions (in batches of 20 if needed)
  for (const subject of subjects) {
    if (allQuestions.length >= totalQuestions) break;
    
    let subjectQuestionsNeeded = Math.min(questionsPerSubject, totalQuestions - allQuestions.length);
    console.log(`[Marathon] Subject ${subject.name}: need ${subjectQuestionsNeeded} questions`);
    
    while (subjectQuestionsNeeded > 0) {
      const batchSize = Math.min(subjectQuestionsNeeded, MAX_PER_REQUEST);
      
      try {
        console.log(`[Marathon] Generating batch of ${batchSize} for ${subject.name}...`);
        
        const response = await aiEngineApi.generateQuiz({
          subjects: [subject.name],  // subjects must be an array
          topic: subject.topics[0]?.name || "General",
          difficulty,
          number_of_questions: batchSize,
        });

        console.log(`[Marathon] Got ${response.questions.length} questions for ${subject.name}`);

        const convertedQuestions = response.questions.map((q, idx) => {
          // Find correct answer index - handle both string and number formats
          let correctIndex = 0;
          if (typeof q.correct_answer === 'string' && q.options && q.options.length > 0) {
            correctIndex = q.options.indexOf(q.correct_answer);
            if (correctIndex === -1) {
              console.warn(`[Marathon] Correct answer "${q.correct_answer}" not found in options:`, q.options);
              correctIndex = 0;
            }
          } else if (typeof q.correct_answer === 'number') {
            correctIndex = q.correct_answer;
          }
          
          return {
            id: `q_${subject.id}_${Date.now()}_${idx}`,
            subjectId: subject.id,
            topicId: subject.topics[0]?.id || "",
            year: new Date().getFullYear(),
            question: q.question,
            options: q.options,
            correctAnswer: correctIndex,
            explanation: q.explanation || `The correct answer is ${q.correct_answer}`,
            difficulty: difficulty,
            topic: q.subject || subject.name,
          };
        });

        allQuestions.push(...convertedQuestions);
        subjectQuestionsNeeded -= batchSize;
        
        console.log(`[Marathon] Progress: ${allQuestions.length}/${totalQuestions} questions`);
        
        // Small delay between batches to avoid rate limiting
        if (subjectQuestionsNeeded > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`[Marathon] Failed to generate batch for ${subject.name}:`, error);
        failedBatches++;
        subjectQuestionsNeeded -= batchSize; // Skip this batch and continue
        
        // If too many failures, stop trying
        if (failedBatches >= 3) {
          console.warn("[Marathon] Too many failed batches, stopping generation");
          break;
        }
      }
    }
  }

  console.log(`[Marathon] Complete: ${allQuestions.length} questions generated (${failedBatches} failed batches)`);

  // If we got no questions at all, throw error
  if (allQuestions.length === 0) {
    throw new Error("Failed to generate any marathon questions");
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
