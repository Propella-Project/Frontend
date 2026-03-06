import { getNigeriaHour } from "./time";

/**
 * Get greeting based on Nigeria time
 */
export function getGreeting(): string {
  const hour = getNigeriaHour();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good evening";
  } else {
    return "Good night";
  }
}

/**
 * Get personalized greeting with name
 */
export function getPersonalizedGreeting(name: string): string {
  return `${getGreeting()}, ${name}`;
}

/**
 * Get motivational message based on time of day
 */
export function getMotivationalMessage(): string {
  const hour = getNigeriaHour();

  if (hour >= 5 && hour < 12) {
    return "Start your day with knowledge!";
  } else if (hour >= 12 && hour < 17) {
    return "Keep the momentum going!";
  } else if (hour >= 17 && hour < 21) {
    return "Evening study sessions are powerful!";
  } else {
    return "Rest well, tomorrow brings new learning!";
  }
}

/**
 * Get study tip based on time of day
 */
export function getStudyTip(): string {
  const tips = [
    "Take breaks every 25 minutes for better retention",
    "Review your notes before sleeping for better memory",
    "Explain concepts out loud to test your understanding",
    "Use flashcards for quick revision sessions",
    "Practice past questions to familiarize with exam format",
    "Study difficult topics when your mind is freshest",
    "Create mind maps to connect related concepts",
    "Teach what you've learned to someone else",
  ];

  // Use time to deterministically select a tip
  const hour = getNigeriaHour();
  return tips[hour % tips.length];
}
