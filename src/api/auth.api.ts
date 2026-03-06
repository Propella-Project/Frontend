// Authentication API
// Note: Authentication is already implemented, this file is for reference
// and any additional auth-related API calls

import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post(ENDPOINTS.auth.login, payload);
    return response.data;
  },

  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    const response = await apiClient.post(ENDPOINTS.auth.signup, payload);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await apiClient.post(ENDPOINTS.auth.refresh, {
      refresh: refreshToken,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(ENDPOINTS.auth.logout);
    localStorage.removeItem("propella_token");
    localStorage.removeItem("propella_refresh_token");
  },

  // Helper to set token after login
  setToken: (token: string): void => {
    localStorage.setItem("propella_token", token);
  },

  // Helper to get token
  getToken: (): string | null => {
    return localStorage.getItem("propella_token");
  },

  // Helper to check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("propella_token");
  },
};
