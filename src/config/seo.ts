import { ENV } from "@/config/env";

/**
 * SEO defaults and per-route overrides.
 * Set VITE_SITE_URL in env for production canonical URLs (e.g. https://app.propella.ng).
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://propella.ng").replace(/\/$/, "");

export const DEFAULT_OG_IMAGE =
  import.meta.env.VITE_OG_IMAGE_URL || `${SITE_URL}/og-image.png`;

export const SITE_NAME = "PROPELLA";

export const DEFAULT_SEO = {
  title: `${SITE_NAME} – JAMB AI Tutor for Nigerian Students`,
  description:
    "Prepare for JAMB with AI-powered practice, personalized roadmaps, and an adaptive tutor. Study smarter with PROPELLA.",
  keywords: [
    "JAMB",
    "PROPELLA",
    "UTME",
    "Nigeria",
    "AI tutor",
    "exam prep",
    "WAEC",
    "practice questions",
  ].join(", "),
  /** Allow search engines to index and follow links */
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" as const,
  noindex: false,
} as const;

export type SeoConfig = {
  title: string;
  description: string;
  keywords?: string;
  robots?: string;
  /** When true, sets noindex,nofollow and hides from Open Graph as primary */
  noindex?: boolean;
};

/** Exact path matches (leading slash, no trailing slash except root) */
const EXACT: Record<string, SeoConfig> = {
  "/": {
    ...DEFAULT_SEO,
    title: `${SITE_NAME} – JAMB AI Tutor for Nigerian Students`,
  },
  "/login": {
    ...DEFAULT_SEO,
    title: `Login – ${SITE_NAME}`,
    description: "Sign in to your PROPELLA account to continue your JAMB preparation.",
  },
  "/forgot-password": {
    ...DEFAULT_SEO,
    title: `Forgot password – ${SITE_NAME}`,
    description: "Reset your PROPELLA account password.",
    robots: "noindex, follow",
    noindex: true,
  },
  "/reset-password": {
    ...DEFAULT_SEO,
    title: `Reset password – ${SITE_NAME}`,
    description: "Set a new password for your PROPELLA account.",
    robots: "noindex, follow",
    noindex: true,
  },
  "/onboarding": {
    title: `Onboarding – ${SITE_NAME}`,
    description: "Complete your profile to personalize your learning journey.",
    robots: "noindex, nofollow, noarchive",
    noindex: true,
  },
  "/dashboard": {
    title: `Dashboard – ${SITE_NAME}`,
    description: "Your learning dashboard and daily progress.",
    robots: "noindex, nofollow, noarchive",
    noindex: true,
  },
  "/dashboard/pay": {
    title: `Subscribe – ${SITE_NAME}`,
    description: "Choose a plan and unlock full access to PROPELLA.",
    robots: "noindex, nofollow, noarchive",
    noindex: true,
  },
  "/payments/verify": {
    title: `Payment verification – ${SITE_NAME}`,
    description: "Confirming your subscription payment.",
    robots: "noindex, nofollow, noarchive",
    noindex: true,
  },
  "/verify": {
    title: `Verify – ${SITE_NAME}`,
    description: "Account verification.",
    robots: "noindex, nofollow, noarchive",
    noindex: true,
  },
  "/payment/callback": {
    title: `Payment – ${SITE_NAME}`,
    description: "Payment callback.",
    robots: "noindex, nofollow, noarchive",
    noindex: true,
  },
  "/payment-success": {
    title: `Payment success – ${SITE_NAME}`,
    description: "Payment confirmation.",
    robots: "noindex, nofollow, noarchive",
    noindex: true,
  },
};

function prefixConfig(pathname: string): SeoConfig | null {
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard" && pathname !== "/dashboard/pay") {
    return {
      title: `Dashboard – ${SITE_NAME}`,
      description: "Your learning dashboard and daily progress.",
      robots: "noindex, nofollow, noarchive",
      noindex: true,
    };
  }
  return null;
}

export function getSeoForPath(pathname: string): SeoConfig {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (EXACT[normalized]) return EXACT[normalized];
  const fromPrefix = prefixConfig(normalized);
  if (fromPrefix) return fromPrefix;
  return {
    ...DEFAULT_SEO,
    title: `${SITE_NAME}`,
    description: DEFAULT_SEO.description,
  };
}

export function buildJsonLdOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_SEO.description,
    logo: DEFAULT_OG_IMAGE,
    sameAs: ENV.LANDING_PAGE_URL,
  };
}

export function buildJsonLdWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_SEO.description,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}
