import axios from "axios";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ENV } from "@/config/env";

// Cookie helper for cross-subdomain token reading
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

// Token storage keys (support both dashboard and landing page token names)
const TOKEN_KEY = "propella_token";
const TOKEN_KEY_ALT = "access_token";  // Landing page uses this
const REFRESH_TOKEN_KEY = "propella_refresh_token";
const REFRESH_TOKEN_KEY_ALT = "refresh_token";  // Landing page uses this
const USER_ID_KEY = "propella_user_id";

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable CORS credentials
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// Notify all subscribers with new token
function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

/** Access token: cookie → sessionStorage (login) → legacy localStorage. Logout clears all. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const cookieToken = getCookie("access_token") || getCookie("auth_token");
  if (cookieToken) return cookieToken;
  try {
    const fromSession = sessionStorage.getItem("propella_access_token");
    if (fromSession) return fromSession;
  } catch {
    /* ignore */
  }
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY_ALT);
}

// Get stored refresh token (cookies → sessionStorage → legacy localStorage)
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const cookieToken = getCookie("refresh_token");
  if (cookieToken) return cookieToken;
  try {
    const s =
      sessionStorage.getItem("propella_refresh_token") ||
      sessionStorage.getItem("refresh_token");
    if (s) return s;
  } catch {
    /* ignore */
  }
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    localStorage.getItem(REFRESH_TOKEN_KEY_ALT)
  );
}

// Set tokens (prefer cookies from Login; this mirrors refresh into session for API client refresh flow)
export function setTokens(access: string, refresh?: string, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("propella_access_token", access);
    if (refresh) {
      sessionStorage.setItem("propella_refresh_token", refresh);
      sessionStorage.setItem("refresh_token", refresh);
    }
  } catch {
    /* ignore */
  }
  if (userId) {
    try {
      sessionStorage.setItem(USER_ID_KEY, userId);
    } catch {
      /* ignore */
    }
  }
}

// Clear tokens (logout)
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY_ALT);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY_ALT);
  localStorage.removeItem(USER_ID_KEY);
  try {
    sessionStorage.removeItem("propella_access_token");
    sessionStorage.removeItem("propella_refresh_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem(USER_ID_KEY);
  } catch {
    /* ignore */
  }
}

// Refresh token function
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(`${ENV.API_BASE_URL}/accounts/token/refresh/`, {
      refresh: refreshToken,
    });

    const { access } = response.data;
    setTokens(access);
    return access;
  } catch (error) {
    console.error("[Auth] Token refresh failed:", error);
    clearTokens();
    return null;
  }
}

// Public endpoints – do NOT send Bearer token (login and other unauthenticated routes)
const PUBLIC_ENDPOINTS = [
  "/accounts/login/",
  "/accounts/token/",
  "/accounts/token/refresh/",
  "/accounts/register/",
  "/accounts/verify-email/",
  "/accounts/resend-code/",
  "/accounts/forgot-password/",
  "/accounts/reset-password/",
];

function isPublicEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

// Request interceptor: use access token from login as Bearer for all requests except public endpoints
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers && !isPublicEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          onTokenRefreshed(newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        } else {
          // Token refresh failed - redirect to login
          handleAuthFailure();
        }
      } catch (refreshError) {
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        // Reset subscribers after a delay to prevent memory leaks
        setTimeout(() => {
          if (refreshSubscribers.length > 0) {
            refreshSubscribers.forEach((cb) => cb(""));
            refreshSubscribers = [];
          }
        }, 5000);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn("[Auth] 403 Forbidden - insufficient permissions");
      // Don't clear tokens, just reject
    }

    // Handle network errors (no response)
    if (!error.response) {
      console.error("[Network] No response from server");
      // Add a custom property to identify network errors
      (error as AxiosError & { isNetworkError?: boolean }).isNetworkError = true;
    }

    // Handle timeout
    if (error.code === "ECONNABORTED") {
      console.error("[Network] Request timeout");
      (error as AxiosError & { isTimeout?: boolean }).isTimeout = true;
    }

    return Promise.reject(error);
  }
);

// Handle authentication failure
function handleAuthFailure(): void {
  clearTokens();
  
  // Dispatch event for components to listen to
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("propella:auth:failure"));
    
    // Only redirect if we're not already on the login page
    const currentPath = window.location.pathname;
    const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
    
    if (!publicPaths.some((path) => currentPath.includes(path))) {
      // Store the current path to redirect back after login
      sessionStorage.setItem("propella_redirect_after_login", currentPath);
      
      // Redirect to login
      window.location.href = "/login";
    }
  }
}

// Utility to check if error is auth-related
export function isAuthError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return error.response?.status === 401 || error.response?.status === 403;
}

// Utility to check if error is network-related
export function isNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return !error.response || (error as AxiosError & { isNetworkError?: boolean }).isNetworkError === true;
}

// Utility to get error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Server returned error response
    if (error.response?.data) {
      const data = error.response.data as { detail?: string; message?: string | object; error?: string | object };
      // Helper to extract string from potentially object value
      const extractString = (val: string | object | undefined): string => {
        if (typeof val === 'object' && val !== null) {
          return (val as {message?: string; code?: string}).message || 
                 (val as {message?: string; code?: string}).code || 
                 JSON.stringify(val);
        }
        return val || '';
      };
      return data.detail || extractString(data.message) || extractString(data.error) || `Error ${error.response.status}`;
    }
    // Network error
    if (isNetworkError(error)) {
      return "Network error. Please check your connection.";
    }
    // Timeout
    if ((error as AxiosError & { isTimeout?: boolean }).isTimeout) {
      return "Request timed out. Please try again.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}

export default apiClient;
