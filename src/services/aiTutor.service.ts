import { aiEngineApi } from "@/api/ai-engine.api";
import { FEATURES } from "@/config/env";

// Internal ChatMessage type for service
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Map personality types to AI Engine tutor personalities
type PersonalityType = "mentor" | "cheerleader" | "professor" | "peer";

const personalityMapping: Record<PersonalityType, string> = {
  mentor: "mentor",
  cheerleader: "cheerleader",
  professor: "professor",
  peer: "mc_flow",
};

// Send message to AI tutor
export async function sendMessageToTutor(
  message: string,
  chatId: string | undefined,
  personality: PersonalityType = "mentor"
): Promise<{
  chatId: string;
  reply: string;
  messages: ChatMessage[];
}> {
  if (!FEATURES.ENABLE_AI_ENGINE) {
    throw new Error("AI Engine is disabled");
  }

  try {
    const response = await aiEngineApi.sendMessage({
      message,
      chat_id: chatId,
      tutor_personality: personalityMapping[personality] as
        | "mc_flow"
        | "professor"
        | "mentor"
        | "cheerleader",
    });

    return {
      chatId: response.chat_id,
      reply: response.response,
      messages: [{
        id: response.message_id,
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      }],
    };
  } catch (error) {
    console.error("Failed to send message to AI tutor:", error);
    throw error;
  }
}

// Get topic explanation from AI tutor
export async function getTopicExplanation(
  subject: string,
  topic: string,
  format?: "text" | "song" | "story" | "analogy",
  difficulty?: "simple" | "standard" | "detailed"
): Promise<{
  explanation: string;
  followUpQuestions: string[];
}> {
  if (!FEATURES.ENABLE_AI_ENGINE) {
    throw new Error("AI Engine is disabled");
  }

  try {
    const response = await aiEngineApi.explainTopic({
      student_id: "user_1", // TODO: Use actual user ID
      subject,
      topic,
      format: format || "text",
      difficulty: difficulty || "standard",
    });

    return {
      explanation: response.explanation,
      followUpQuestions: response.follow_up_questions,
    };
  } catch (error) {
    console.error("Failed to get topic explanation:", error);
    throw error;
  }
}

// Get a study tip
export async function getStudyTip(): Promise<{
  tip: string;
  category: string;
}> {
  if (!FEATURES.ENABLE_AI_ENGINE) {
    return {
      tip: "Break your study sessions into manageable chunks of 25-30 minutes with short breaks in between.",
      category: "productivity",
    };
  }

  try {
    // Use health check endpoint as a fallback for study tips
    const health = await aiEngineApi.healthCheck();
    return {
      tip: health.status === "healthy" 
        ? "AI Engine is ready to help you study!"
        : "Take regular breaks during study sessions to improve retention.",
      category: "general",
    };
  } catch (error) {
    console.error("Failed to get study tip:", error);
    return {
      tip: "Break your study sessions into manageable chunks of 25-30 minutes with short breaks in between.",
      category: "productivity",
    };
  }
}

// Stream message from AI tutor (for real-time responses)
export async function streamMessageFromTutor(
  message: string,
  chatId: string | undefined,
  personality: PersonalityType = "mentor",
  onChunk: (chunk: string) => void
): Promise<void> {
  if (!FEATURES.ENABLE_AI_ENGINE) {
    throw new Error("AI Engine is disabled");
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_AI_ENGINE_BASE_URL}/tutor/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": import.meta.env.VITE_AI_ENGINE_API_KEY || "",
      },
      body: JSON.stringify({
        message,
        chat_id: chatId,
        tutor_personality: personalityMapping[personality],
      }),
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value));
    }
  } catch (error) {
    console.error("Failed to stream message from AI tutor:", error);
    throw error;
  }
}

export const aiTutorService = {
  sendMessageToTutor,
  getTopicExplanation,
  getStudyTip,
  streamMessageFromTutor,
};

export default aiTutorService;
