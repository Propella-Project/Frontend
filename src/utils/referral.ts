/**
 * Referral Attribution Utility
 * 
 * Captures referral data from URL parameters and stores them
 * for later use during signup.
 */

const REFERRER_CODE_KEY = "referrerCode";
const REFERRER_NAME_KEY = "referrerName";
const REFERRER_EMAIL_KEY = "referrerEmail";

/**
 * Capture referral data from URL search params
 * Supports both 'code' (new) and 'ref' (legacy) parameters
 * Call this on app initialization
 */
export function captureReferralData(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  
  // Support both 'code' (new format) and 'ref' (legacy format)
  const code = params.get("code") || params.get("ref");
  const referrerName = params.get("name");
  const referrerEmail = params.get("email");

  if (code) {
    localStorage.setItem(REFERRER_CODE_KEY, code);
    console.log("[Referral] Captured referrer code:", code);
  }

  if (referrerName) {
    localStorage.setItem(REFERRER_NAME_KEY, referrerName);
    console.log("[Referral] Captured referrer name:", referrerName);
  }

  if (referrerEmail) {
    localStorage.setItem(REFERRER_EMAIL_KEY, referrerEmail);
    console.log("[Referral] Captured referrer email:", referrerEmail);
  }
}

/**
 * Get stored referral data
 */
export function getReferralData(): {
  code: string | null;
  name: string | null;
  email: string | null;
} {
  if (typeof window === "undefined") {
    return { code: null, name: null, email: null };
  }

  return {
    code: localStorage.getItem(REFERRER_CODE_KEY),
    name: localStorage.getItem(REFERRER_NAME_KEY),
    email: localStorage.getItem(REFERRER_EMAIL_KEY),
  };
}

/**
 * Check if user was referred
 */
export function hasReferralData(): boolean {
  return !!localStorage.getItem(REFERRER_CODE_KEY);
}

/**
 * Get referrer display name for UI
 */
export function getReferrerDisplayName(): string | null {
  const { name, code } = getReferralData();
  return name || code;
}

/**
 * Clear referral data after successful signup
 */
export function clearReferralData(): void {
  localStorage.removeItem(REFERRER_CODE_KEY);
  localStorage.removeItem(REFERRER_NAME_KEY);
  localStorage.removeItem(REFERRER_EMAIL_KEY);
  console.log("[Referral] Cleared referral data");
}

/**
 * Build referral payload for signup API
 * This sends the referrer's code (who referred the current user)
 */
export function buildReferralPayload(): {
  referred_by?: string;  // Referrer's code (who referred me)
  referrer_name?: string;
  referrer_email?: string;
} {
  const { code, name, email } = getReferralData();
  
  const payload: {
    referred_by?: string;
    referrer_name?: string;
    referrer_email?: string;
  } = {};

  if (code) payload.referred_by = code;  // The code of the person who referred me
  if (name) payload.referrer_name = name;
  if (email) payload.referrer_email = email;

  return payload;
}

/**
 * Build a referral link with the user's personal referral code
 * Uses /register path with code parameter
 * @param referralCode - The user's personal referral code from backend
 * @param nickname - The user's nickname for display
 * @param email - The user's email (optional)
 * @returns The full referral URL
 */
export function buildReferralLink(
  referralCode: string,
  nickname?: string,
  email?: string
): string {
  const baseUrl = "https://propella.ng";
  const params = new URLSearchParams();
  
  params.set("code", referralCode);  // User's personal referral code
  if (nickname) params.set("name", nickname);
  if (email) params.set("email", email);
  
  return `${baseUrl}/register?${params.toString()}`;
}
