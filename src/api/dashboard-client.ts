/**
 * Dashboard API Client – Bearer auth using access token from login
 */

import { ENV } from "@/config/env";
import { getToken } from "./client";

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

function isPublicEndpoint(endpoint: string): boolean {
  return PUBLIC_ENDPOINTS.some((p) => endpoint.includes(p));
}

async function fetchWithCredentials(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("http") ? endpoint : `${ENV.API_BASE_URL}${endpoint}`;
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token && !isPublicEndpoint(endpoint)) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  return response;
}

/**
 * GET request with credentials
 */
export async function get<T>(endpoint: string): Promise<T> {
  const response = await fetchWithCredentials(endpoint);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = error.detail || (typeof error.message === 'object' ? error.message?.message || error.message?.code : error.message) || `Request failed: ${response.status}`;
    throw new Error(msg);
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
    const msg = error.detail || (typeof error.message === 'object' ? error.message?.message || error.message?.code : error.message) || `Request failed: ${response.status}`;
    throw new Error(msg);
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
    const msg = error.detail || (typeof error.message === 'object' ? error.message?.message || error.message?.code : error.message) || `Request failed: ${response.status}`;
    throw new Error(msg);
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
    const msg = error.detail || (typeof error.message === 'object' ? error.message?.message || error.message?.code : error.message) || `Request failed: ${response.status}`;
    throw new Error(msg);
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
    const msg = error.detail || (typeof error.message === 'object' ? error.message?.message || error.message?.code : error.message) || `Request failed: ${response.status}`;
    throw new Error(msg);
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
