import axios from "axios";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ENV } from "@/config/env";

// Token storage keys
const TOKEN_KEY = "propella_token";
const REFRESH_TOKEN_KEY = "propella_refresh_token";
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

// Get stored token
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Get stored refresh token
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// Set tokens
export function setTokens(access: string, refresh?: string, userId?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
  if (userId) {
    localStorage.setItem(USER_ID_KEY, userId);
  }
}

// Clear tokens (logout)
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
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

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
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
      const data = error.response.data as { detail?: string; message?: string; error?: string };
      return data.detail || data.message || data.error || `Error ${error.response.status}`;
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
