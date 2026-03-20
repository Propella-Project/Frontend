/**
 * Cookie utilities for cross-subdomain authentication
 *
 * On *.propella.ng → Domain=.propella.ng
 * On other hosts (e.g. *.vercel.app) → host-only cookies (omit Domain) so the browser stores them.
 */

/** Domain for Set-Cookie; undefined = host-only (required for non-propella.ng deploys) */
export function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return undefined;
  if (host.endsWith("propella.ng")) return ".propella.ng";
  return undefined;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  
  return null;
}

/**
 * Set a cookie (cross-subdomain on propella.ng, host-only elsewhere)
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 7,
  domain?: string
): void {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const domainAttr = domain ?? getCookieDomain();
  const domainPart = domainAttr ? `;domain=${domainAttr}` : "";
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? ";Secure"
      : "";

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}${domainPart}`;
}

/** Delete cookie for host-only and, if applicable, .propella.ng */
export function deleteCookie(name: string, domain?: string): void {
  if (typeof document === "undefined") return;

  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  document.cookie = `${name}=;${expired}`;

  const d = domain ?? getCookieDomain();
  if (d) {
    document.cookie = `${name}=;${expired};domain=${d}`;
  }
  if (d !== ".propella.ng") {
    document.cookie = `${name}=;${expired};domain=.propella.ng`;
  }
}

/**
 * Prefer cookies; fall back to in-tab access token (do not clear LS here — logout does that).
 */
export function getAuthToken(): string | null {
  const cookieToken = getCookie("access_token") || getCookie("auth_token");
  if (cookieToken) return cookieToken;
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("propella_token") || localStorage.getItem("access_token");
}

/**
 * Get refresh token from cookies or localStorage
 */
export function getRefreshToken(): string | null {
  // Try cookies first
  const cookieToken = getCookie("refresh_token");
  if (cookieToken) return cookieToken;
  
  // Fallback to localStorage
  return localStorage.getItem("refresh_token") ||
         localStorage.getItem("propella_refresh_token");
}

/**
 * Clear all auth tokens (cookies and localStorage)
 */
export function clearAllAuthTokens(): void {
  // Clear cookies
  deleteCookie("access_token");
  deleteCookie("auth_token");
  deleteCookie("refresh_token");
  
  // Clear localStorage
  localStorage.removeItem("access_token");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("propella_token");
  localStorage.removeItem("propella_refresh_token");
  localStorage.removeItem("propella_user_id");
}
