/**
 * Referral Attribution Utility
 *
 * Captures referral data from URL and stores in sessionStorage only
 * so no localStorage is written before user has logged in.
 * Used during signup/login to send referrer info to the server.
 */

const REFERRER_CODE_KEY = "referrerCode";
const REFERRER_NAME_KEY = "referrerName";
const REFERRER_EMAIL_KEY = "referrerEmail";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return sessionStorage;
}

/**
 * Capture referral data from URL search params (sessionStorage only; no localStorage before login)
 */
export function captureReferralData(): void {
  const storage = getStorage();
  if (!storage) return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || params.get("ref");
  const referrerName = params.get("name");
  const referrerEmail = params.get("email");

  if (code) storage.setItem(REFERRER_CODE_KEY, code);
  if (referrerName) storage.setItem(REFERRER_NAME_KEY, referrerName);
  if (referrerEmail) storage.setItem(REFERRER_EMAIL_KEY, referrerEmail);
}

/**
 * Get stored referral data (from sessionStorage)
 */
export function getReferralData(): {
  code: string | null;
  name: string | null;
  email: string | null;
} {
  const storage = getStorage();
  if (!storage) return { code: null, name: null, email: null };
  return {
    code: storage.getItem(REFERRER_CODE_KEY),
    name: storage.getItem(REFERRER_NAME_KEY),
    email: storage.getItem(REFERRER_EMAIL_KEY),
  };
}

/**
 * Check if user was referred
 */
export function hasReferralData(): boolean {
  const storage = getStorage();
  return storage ? !!storage.getItem(REFERRER_CODE_KEY) : false;
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
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(REFERRER_CODE_KEY);
  storage.removeItem(REFERRER_NAME_KEY);
  storage.removeItem(REFERRER_EMAIL_KEY);
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
