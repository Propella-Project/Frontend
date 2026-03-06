/**
 * Time utility functions
 */

// Nigeria timezone
export const NIGERIA_TIMEZONE = "Africa/Lagos";

/**
 * Get current time in Nigeria timezone
 */
export function getNigeriaTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: NIGERIA_TIMEZONE })
  );
}

/**
 * Get current hour in Nigeria (0-23)
 */
export function getNigeriaHour(): number {
  return getNigeriaTime().getHours();
}

/**
 * Format date to Nigeria time string
 */
export function formatNigeriaTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-NG", {
    timeZone: NIGERIA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format date to Nigeria date string
 */
export function formatNigeriaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-NG", {
    timeZone: NIGERIA_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Check if two dates are the same day in Nigeria timezone
 */
export function isSameDayNigeria(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1.toLocaleString("en-US", { timeZone: NIGERIA_TIMEZONE }));
  const d2 = new Date(date2.toLocaleString("en-US", { timeZone: NIGERIA_TIMEZONE }));
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatNigeriaDate(then);
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Calculate time remaining from a target date
 */
export function getTimeRemaining(targetDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, isExpired: false };
}
