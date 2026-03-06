/**
 * Format score as percentage
 */
export function formatScore(score: number, total: number): string {
  if (total === 0) return "0%";
  const percentage = Math.round((score / total) * 100);
  return `${percentage}%`;
}

/**
 * Get score color based on percentage
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return "#10B981"; // Green
  if (percentage >= 60) return "#F59E0B"; // Yellow
  if (percentage >= 40) return "#F97316"; // Orange
  return "#EF4444"; // Red
}

/**
 * Get score label based on percentage
 */
export function getScoreLabel(percentage: number): string {
  if (percentage >= 80) return "Excellent";
  if (percentage >= 60) return "Good";
  if (percentage >= 40) return "Fair";
  return "Needs Work";
}

/**
 * Format rank with emoji
 */
export function formatRank(rank: string): { label: string; emoji: string } {
  const rankMap: Record<string, { label: string; emoji: string }> = {
    rookie: { label: "Rookie", emoji: "🌱" },
    scholar: { label: "Scholar", emoji: "📚" },
    prodigy: { label: "Prodigy", emoji: "⭐" },
    expert: { label: "Expert", emoji: "🎯" },
    master: { label: "Master", emoji: "🏆" },
    legend: { label: "Legend", emoji: "👑" },
  };

  return rankMap[rank.toLowerCase()] || { label: rank, emoji: "🎓" };
}

/**
 * Format points with suffix
 */
export function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
}

/**
 * Calculate level progress percentage
 */
export function calculateLevelProgress(
  currentPoints: number,
  nextLevelPoints: number,
  currentLevelBasePoints: number = 0
): number {
  const pointsInLevel = currentPoints - currentLevelBasePoints;
  const levelRange = nextLevelPoints - currentLevelBasePoints;
  
  if (levelRange <= 0) return 100;
  
  return Math.min(100, Math.round((pointsInLevel / levelRange) * 100));
}
