import { useState, useCallback, useEffect } from "react";
import { settingsApi } from "@/api/settings.api";
import { useUserStore } from "@/state/user.store";
import { useAppStore } from "@/state/app.store";
import type { ProfileUpdatePayload, ApiError } from "@/types/api.types";
import { toast } from "sonner";

interface UseSettingsReturn {
  loading: boolean;
  error: ApiError | null;
  updateProfile: (updates: ProfileUpdatePayload) => Promise<boolean>;
}

/**
 * Hook to manage user settings
 */
export function useSettings(): UseSettingsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const { updateProfile: updateUserProfile } = useUserStore();

  const updateProfile = useCallback(
    async (updates: ProfileUpdatePayload): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const { user: updatedUser } = await settingsApi.updateProfile(updates);

        if (updatedUser && typeof updatedUser === "object") {
          updateUserProfile({
            email: (updatedUser.email as string) ?? undefined,
            username: (updatedUser.username as string) ?? undefined,
            nickname: (updatedUser.nickname as string) ?? undefined,
            ...updates,
          });
        } else {
          updateUserProfile(updates);
        }

        toast.success("Profile updated successfully!");
        return true;
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : "Failed to update profile",
          status: (err as { response?: { status: number } })?.response?.status || 500,
        };
        setError(apiError);
        toast.error("Failed to update profile");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [updateUserProfile]
  );

  return {
    loading,
    error,
    updateProfile,
  };
}

/**
 * Hook to manage notifications
 */
export function useNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const { notifications, unreadNotificationsCount, setNotifications, markNotificationAsRead } =
    useAppStore();

  const fetchNotifications = useCallback(async () => {
    // Return cached data if available
    if (notifications.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await settingsApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : "Failed to load notifications",
        status: (err as { response?: { status: number } })?.response?.status || 500,
      };
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [notifications.length, setNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await settingsApi.markNotificationAsRead(notificationId);
        markNotificationAsRead(notificationId);
      } catch (err) {
        toast.error("Failed to mark notification as read");
      }
    },
    [markNotificationAsRead]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount: unreadNotificationsCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
  };
}
