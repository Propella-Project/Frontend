import { authApi } from "./auth.api";
import type { ProfileUpdatePayload, Notification } from "@/types/api.types";

export const settingsApi = {
  // Update profile (How_it_works.md §8: PUT /accounts/edit-user/, returns { message, user })
  updateProfile: async (
    payload: ProfileUpdatePayload
  ): Promise<{ message: string; user: Record<string, unknown> }> => {
    const body: Record<string, unknown> = {};
    if (payload.email !== undefined) body.email = payload.email;
    if (payload.first_name !== undefined) body.first_name = payload.first_name;
    if (payload.last_name !== undefined) body.last_name = payload.last_name;
    if (payload.nickname !== undefined) body.nickname = payload.nickname;
    return authApi.editUser(body);
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
