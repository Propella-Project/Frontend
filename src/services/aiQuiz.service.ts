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
        console.log(`[AI Quiz] Mapped letter '${correctAnswer}' to index ${letterIndex}`);
      }
    }
  }
  
  // If still not found, check if correct_answer is a number/index directly
  if (correctAnswerIndex === -1) {
    const numericIndex = parseInt(correctAnswer, 10);
    if (!isNaN(numericIndex) && numericIndex >= 0 && numericIndex < aiQuestion.options.length) {
      correctAnswerIndex = numericIndex;
      console.log(`[AI Quiz] Mapped numeric '${correctAnswer}' to index ${numericIndex}`);
    }
  }
  
  // Log warning if we couldn't find the correct answer
  if (correctAnswerIndex === -1) {
    console.warn(`[AI Quiz] Could not map correct_answer '${aiQuestion.correct_answer}' to any option. Options:`, aiQuestion.options);
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

  // Skip AI Engine if disabled
  if (!FEATURES.ENABLE_AI_ENGINE) {
    console.log("[AI Quiz] AI Engine disabled, using template fallback");
    return getTemplateQuestions(subject.name, count).map((q, idx) => ({
      ...q,
      id: `template_${subject.id}_${Date.now()}_${idx}`,
      subjectId: subject.id,
      topicId: topic?.id || subject.topics[0]?.id || "",
    }));
  }

  try {
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
    console.error("[AI Quiz] Failed to generate AI questions, using template fallback:", error);
    // Return template questions as fallback
    return getTemplateQuestions(subject.name, count).map((q, idx) => ({
      ...q,
      id: `fallback_${subject.id}_${Date.now()}_${idx}`,
      subjectId: subject.id,
      topicId: topic?.id || subject.topics[0]?.id || "",
    }));
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
    console.warn(`[AI Quiz] Requested ${questionsPerSubject} questions per subject, but AI Engine max is ${MAX_PER_REQUEST}. Capping.`);
  }

  // Generate questions for each subject in parallel
  const promises = subjects.map(async (subject, subjectIndex) => {
    try {
      // If AI Engine is disabled, use templates immediately
      if (!FEATURES.ENABLE_AI_ENGINE) {
        console.log(`[AI Quiz] AI Engine disabled, using templates for ${subject.name}`);
        return getTemplateQuestions(subject.name, cappedQuestionsPerSubject).map((q, idx) => ({
          ...q,
          id: `template_${subject.id}_${Date.now()}_${idx}`,
          subjectId: subject.id,
          topicId: subject.topics[0]?.id || "",
        }));
      }
      
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
      console.error(`[AI Quiz] Failed to generate questions for ${subject.name}, using fallback:`, error);
      // Return template questions as fallback for this subject
      return getTemplateQuestions(subject.name, cappedQuestionsPerSubject).map((q, idx) => ({
        ...q,
        id: `fallback_${subject.id}_${Date.now()}_${idx}`,
        subjectId: subject.id,
        topicId: subject.topics[0]?.id || "",
      }));
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

// Template questions for fallback when AI Engine fails
function getTemplateQuestions(subjectName: string, count: number): Question[] {
  const templates: Record<string, Array<{q: string; options: string[]; correct: number; explanation: string}>> = {
    mathematics: [
      { q: "What is 2 + 2?", options: ["3", "4", "5", "6"], correct: 1, explanation: "2 + 2 = 4" },
      { q: "What is the square root of 16?", options: ["2", "4", "8", "16"], correct: 1, explanation: "√16 = 4" },
      { q: "Solve: 3x = 12", options: ["3", "4", "6", "9"], correct: 1, explanation: "x = 12/3 = 4" },
      { q: "What is 25% of 100?", options: ["15", "20", "25", "30"], correct: 2, explanation: "25% of 100 = 25" },
      { q: "What is the value of π (pi) approximately?", options: ["2.14", "3.14", "4.14", "5.14"], correct: 1, explanation: "π ≈ 3.14" },
      { q: "What is 5²?", options: ["10", "15", "25", "50"], correct: 2, explanation: "5² = 25" },
      { q: "What is the next number: 2, 4, 6, 8, ?", options: ["9", "10", "12", "14"], correct: 1, explanation: "The pattern adds 2 each time" },
      { q: "If a = 3 and b = 4, what is a + b?", options: ["6", "7", "8", "9"], correct: 1, explanation: "3 + 4 = 7" },
    ],
    english: [
      { q: "What is the synonym of 'Happy'?", options: ["Sad", "Joyful", "Angry", "Tired"], correct: 1, explanation: "Joyful is a synonym for happy" },
      { q: "Which is a noun?", options: ["Quickly", "Beautiful", "Table", "Running"], correct: 2, explanation: "Table is a noun (a thing)" },
      { q: "What is the past tense of 'go'?", options: ["Goes", "Went", "Gone", "Going"], correct: 1, explanation: "The past tense of go is went" },
      { q: "Which word is spelled correctly?", options: ["Accomodate", "Accommodate", "Acommodate", "Acomodate"], correct: 1, explanation: "Accommodate is the correct spelling" },
      { q: "What is an antonym of 'Big'?", options: ["Large", "Huge", "Small", "Giant"], correct: 2, explanation: "Small is the opposite of big" },
      { q: "Which is a verb?", options: ["Blue", "Quickly", "Run", "Happiness"], correct: 2, explanation: "Run is a verb (an action)" },
      { q: "What is the plural of 'child'?", options: ["Childs", "Children", "Childrens", "Childes"], correct: 1, explanation: "The plural of child is children" },
      { q: "Which sentence is correct?", options: ["She don't like apples", "She doesn't likes apples", "She doesn't like apples", "She don't likes apples"], correct: 2, explanation: "'She doesn't like apples' is grammatically correct" },
    ],
    physics: [
      { q: "What is the SI unit of force?", options: ["Watt", "Newton", "Joule", "Pascal"], correct: 1, explanation: "Newton (N) is the SI unit of force" },
      { q: "What is the speed of light in vacuum?", options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"], correct: 0, explanation: "Speed of light ≈ 3 × 10⁸ m/s" },
      { q: "What is the formula for kinetic energy?", options: ["KE = mv", "KE = ½mv²", "KE = mgh", "KE = mv²"], correct: 1, explanation: "Kinetic Energy = ½mv²" },
      { q: "What is the unit of resistance?", options: ["Volt", "Ampere", "Ohm", "Watt"], correct: 2, explanation: "Ohm (Ω) is the unit of electrical resistance" },
      { q: "What type of lens corrects myopia?", options: ["Convex", "Concave", "Bifocal", "Plano"], correct: 1, explanation: "Concave lenses correct nearsightedness" },
      { q: "What is g (acceleration due to gravity)?", options: ["8.9 m/s²", "9.8 m/s²", "10 m/s²", "12 m/s²"], correct: 1, explanation: "g ≈ 9.8 m/s² on Earth's surface" },
      { q: "Which determines loudness of sound?", options: ["Frequency", "Wavelength", "Amplitude", "Speed"], correct: 2, explanation: "Amplitude determines loudness" },
      { q: "What is the formula for pressure?", options: ["P = F/A", "P = F×A", "P = A/F", "P = F + A"], correct: 0, explanation: "Pressure = Force/Area" },
    ],
    chemistry: [
      { q: "What is the chemical formula for water?", options: ["CO₂", "H₂O", "NaCl", "O₂"], correct: 1, explanation: "Water is H₂O" },
      { q: "Which gas is known as 'laughing gas'?", options: ["Oxygen", "Nitrous oxide", "Carbon dioxide", "Helium"], correct: 1, explanation: "N₂O is commonly known as laughing gas" },
      { q: "What is the atomic number of Carbon?", options: ["4", "6", "12", "8"], correct: 1, explanation: "Carbon has atomic number 6" },
      { q: "Which element has symbol 'Na'?", options: ["Nickel", "Sodium", "Nitrogen", "Neon"], correct: 1, explanation: "Na is the symbol for Sodium" },
      { q: "What bond forms between Na and Cl?", options: ["Covalent", "Ionic", "Metallic", "Hydrogen"], correct: 1, explanation: "NaCl is an ionic bond" },
      { q: "What is the pH of pure water?", options: ["0", "7", "14", "5"], correct: 1, explanation: "Pure water has pH = 7 (neutral)" },
      { q: "Which gas is released when acid reacts with metal?", options: ["Oxygen", "Nitrogen", "Hydrogen", "Carbon dioxide"], correct: 2, explanation: "Acids + metals produce Hydrogen gas" },
      { q: "What is the formula for table salt?", options: ["KCl", "NaCl", "CaCl₂", "MgCl₂"], correct: 1, explanation: "Table salt is Sodium Chloride (NaCl)" },
    ],
    biology: [
      { q: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"], correct: 1, explanation: "Mitochondria produce ATP (energy) for the cell" },
      { q: "What is the basic unit of life?", options: ["Tissue", "Organ", "Cell", "Molecule"], correct: 2, explanation: "The cell is the basic structural unit of life" },
      { q: "Which organelle contains chlorophyll?", options: ["Mitochondria", "Ribosome", "Chloroplast", "Nucleus"], correct: 2, explanation: "Chloroplast contains chlorophyll for photosynthesis" },
      { q: "What do red blood cells carry?", options: ["Carbon dioxide", "Oxygen", "Nutrients", "Waste"], correct: 1, explanation: "RBCs carry oxygen from lungs to tissues" },
      { q: "Which gas do plants absorb?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct: 2, explanation: "Plants absorb CO₂ for photosynthesis" },
      { q: "What is the largest organ in the human body?", options: ["Heart", "Liver", "Skin", "Brain"], correct: 2, explanation: "Skin is the largest organ" },
      { q: "Which blood type is the universal donor?", options: ["A", "B", "AB", "O"], correct: 3, explanation: "Type O negative is the universal donor" },
      { q: "What is cell division called?", options: ["Mitosis", "Osmosis", "Diffusion", "Respiration"], correct: 0, explanation: "Mitosis is the process of cell division" },
    ],
  };
  
  const normalizedSubject = subjectName.toLowerCase().replace(/[^a-z]/g, '');
  const subjectTemplates = templates[normalizedSubject] || templates.mathematics;
  
  // Generate variations by shuffling and repeating
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const template = subjectTemplates[i % subjectTemplates.length];
    questions.push({
      id: `template_${normalizedSubject}_${i}_${Date.now()}`,
      subjectId: normalizedSubject,
      topicId: "general",
      year: new Date().getFullYear(),
      question: template.q,
      options: template.options,
      correctAnswer: template.correct,
      explanation: template.explanation,
      difficulty: "medium",
      topic: subjectName,
    });
  }
  return questions;
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
      
      // Skip AI Engine if disabled
      if (!FEATURES.ENABLE_AI_ENGINE) {
        console.log(`[Marathon] AI Engine disabled, using templates for ${subject.name}`);
        const templateQuestions = getTemplateQuestions(subject.name, batchSize).map((q, idx) => ({
          ...q,
          id: `q_${subject.id}_${Date.now()}_${idx}`,
          subjectId: subject.id,
          topicId: subject.topics[0]?.id || "",
        }));
        allQuestions.push(...templateQuestions);
        subjectQuestionsNeeded -= batchSize;
        continue;
      }
      
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
            console.warn(`[Marathon] Correct answer "${q.correct_answer}" not found in options:`, q.options);
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
        
        console.log(`[Marathon] Progress: ${allQuestions.length}/${totalQuestions} questions`);
        
        // Small delay between batches to avoid rate limiting
        if (subjectQuestionsNeeded > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`[Marathon] Failed to generate batch for ${subject.name}:`, error);
        failedBatches++;
        
        // Use template questions as fallback for this batch
        console.log(`[Marathon] Using template fallback for ${subject.name}`);
        const templateQuestions = getTemplateQuestions(subject.name, batchSize).map((q, idx) => ({
          ...q,
          id: `fallback_${subject.id}_${Date.now()}_${idx}`,
          subjectId: subject.id,
          topicId: subject.topics[0]?.id || "",
        }));
        allQuestions.push(...templateQuestions);
        subjectQuestionsNeeded -= batchSize;
        
        // If too many failures, continue with templates instead of stopping
        if (failedBatches >= 3) {
          console.warn("[Marathon] Multiple AI failures, using templates for remaining questions");
          const remainingTemplates = getTemplateQuestions(subject.name, subjectQuestionsNeeded).map((q, idx) => ({
            ...q,
            id: `fallback_${subject.id}_${Date.now()}_remaining_${idx}`,
            subjectId: subject.id,
            topicId: subject.topics[0]?.id || "",
          }));
          allQuestions.push(...remainingTemplates);
          subjectQuestionsNeeded = 0;
        }
      }
    }
  }

  console.log(`[Marathon] Complete: ${allQuestions.length} questions generated (${failedBatches} failed batches)`);

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
