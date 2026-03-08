/**
 * Dashboard API Client - Cookie-based Authentication
 * 
 * This client is designed for the Propella Dashboard at dashboard.propella.ng
 * It uses cookie-based authentication with credentials: "include"
 * to communicate with the Django backend at api.propella.ng
 */

import { ENV } from "@/config/env";

// API base URL (without /api suffix)
const API_BASE_URL = ENV.API_BASE_URL.replace(/\/api$/, '');

/**
 * Base fetch function with credentials included
 */
async function fetchWithCredentials(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Always include cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    // Store current URL for redirect after login
    sessionStorage.setItem("propella_redirect_after_login", window.location.pathname);
    
    // Redirect to login page
    window.location.href = ENV.LOGIN_PAGE_URL;
    throw new Error("Unauthorized - redirecting to login");
  }

  return response;
}

/**
 * GET request with credentials
 */
export async function get<T>(endpoint: string): Promise<T> {
  const response = await fetchWithCredentials(endpoint);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Request failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * POST request with credentials
 */
export async function post<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await fetchWithCredentials(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Request failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * PUT request with credentials
 */
export async function put<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await fetchWithCredentials(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Request failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * PATCH request with credentials
 */
export async function patch<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await fetchWithCredentials(endpoint, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Request failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * DELETE request with credentials
 */
export async function del<T>(endpoint: string): Promise<T> {
  const response = await fetchWithCredentials(endpoint, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `Request failed: ${response.status}`);
  }
  
  return response.json();
}

// Export the dashboard client
export const dashboardClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  fetch: fetchWithCredentials,
};

export default dashboardClient;
