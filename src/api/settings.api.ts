import apiClient from "./client";
import { ENDPOINTS } from "@/config/endpoints";
import type { ProfileUpdatePayload, Notification } from "@/types/api.types";

export const settingsApi = {
  // Update profile
  updateProfile: async (payload: ProfileUpdatePayload): Promise<void> => {
    const response = await apiClient.put(ENDPOINTS.settings.updateProfile, payload);
    return response.data;
  },

  // Get notifications - DISABLED (endpoint not available)
  getNotifications: async (): Promise<Notification[]> => {
    // const response = await apiClient.get(ENDPOINTS.settings.notifications);
    // return response.data;
    return []; // Return empty array until endpoint is available
  },

  // Mark notification as read - DISABLED (endpoint not available)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  markNotificationAsRead: async (_notificationId: string): Promise<void> => {
    // const response = await apiClient.patch(
    //   `${ENDPOINTS.settings.notifications}${notificationId}/read/`
    // );
    // return response.data;
    console.log("[Notifications] markAsRead disabled - endpoint not available");
    return Promise.resolve();
  },
};
