// Referral System Types

export interface ReferralUser {
  id: string;
  nickname: string;
  referralCode: string;
  referralPoints: number;
  totalReferrals: number;
  email?: string;
}

export interface ReferralState {
  nickname: string;
  referralCode: string;
  referralPoints: number;
  totalReferrals: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  referralPoints: number;
  totalReferrals: number;
  isCurrentUser: boolean;
}

export type SharePlatform = "twitter" | "facebook" | "linkedin" | "whatsapp" | "sms";

export interface ShareConfig {
  platform: SharePlatform;
  icon: string;
  label: string;
  color: string;
}

// API Types (for future backend integration)
export interface ReferralApiResponse {
  user: ReferralUser;
  leaderboard: LeaderboardEntry[];
}

export interface ReferralSharePayload {
  platform: SharePlatform;
  referralLink: string;
  timestamp: string;
}
