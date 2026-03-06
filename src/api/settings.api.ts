import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { ProfileUpdatePayload, Notification } from "@/types/api.types";

export const settingsApi = {
  // Update profile
  updateProfile: async (payload: ProfileUpdatePayload): Promise<void> => {
    const response = await apiClient.put(ENDPOINTS.settings.updateProfile, payload);
    return response.data;
  },

  // Get notifications
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get(ENDPOINTS.settings.notifications);
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    const response = await apiClient.patch(
      `${ENDPOINTS.settings.notifications}${notificationId}/read/`
    );
    return response.data;
  },
};
