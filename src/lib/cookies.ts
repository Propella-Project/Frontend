/**
 * Cookie utilities for cross-subdomain authentication
 * 
 * Cookies are shared across all *.propella.ng subdomains
 * when set with Domain=.propella.ng
 */

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
 * Set a cookie with cross-subdomain support
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 7,
  domain: string = ".propella.ng"
): void {
  if (typeof document === "undefined") return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${domain};SameSite=Lax`;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, domain: string = ".propella.ng"): void {
  if (typeof document === "undefined") return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
}

/**
 * Get auth token (cookie with 24h expiry is source of truth; when missing, return null)
 */
export function getAuthToken(): string | null {
  const cookieToken = getCookie("access_token") || getCookie("auth_token");
  if (cookieToken) return cookieToken;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("propella_token");
  }
  return null;
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
