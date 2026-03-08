import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useRef, useCallback } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "roadmap" | "task" | "streak" | "general";
  timestamp: number;
  expires: number;
  isRead: boolean;
}

interface NotificationInput {
  title: string;
  message: string;
  type: "roadmap" | "task" | "streak" | "general";
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: NotificationInput) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeExpired: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const now = Date.now();
        const newNotification: Notification = {
          ...notification,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: now,
          expires: now + 12 * 60 * 60 * 1000, // 12 hours default
          isRead: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.isRead 
              ? Math.max(0, state.unreadCount - 1) 
              : state.unreadCount,
          };
        });
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (notification && !notification.isRead) {
            return {
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            };
          }
          return state;
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },

      removeExpired: () => {
        const now = Date.now();
        set((state) => {
          const filtered = state.notifications.filter((n) => n.expires > now);
          // Only update if there are expired notifications to remove
          if (filtered.length === state.notifications.length) {
            return state; // No change needed - return same reference
          }
          return { notifications: filtered };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: "propella-notifications",
      partialize: (state) => ({ 
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// Hook for daily roadmap notification - FIXED with useCallback to prevent infinite loops
export function useDailyRoadmapNotification() {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const removeExpired = useNotificationStore((state) => state.removeExpired);
  
  // Refs to track if operations have already run
  const hasCleanedUp = useRef(false);
  const lastNotificationDate = useRef<string | null>(null);

  // Check if it's 8 AM and add notification - memoized with useCallback
  const checkAndAddDailyNotification = useCallback(() => {
    const now = new Date();
    const today = now.toDateString();
    
    // Only add notification once per day at 8 AM
    if (now.getHours() === 8 && lastNotificationDate.current !== today) {
      addNotification({
        title: "Daily Roadmap Ready! 🎯",
        message: "Your personalized study roadmap is ready for today. Let's ace your JAMB preparation!",
        type: "roadmap",
      });
      lastNotificationDate.current = today;
    }
  }, [addNotification]);

  // Cleanup expired notifications - memoized with useCallback
  const cleanupExpired = useCallback(() => {
    // Only run cleanup once per session to avoid state updates
    if (!hasCleanedUp.current) {
      removeExpired();
      hasCleanedUp.current = true;
    }
  }, [removeExpired]);

  return {
    checkAndAddDailyNotification,
    cleanupExpired,
  };
}

export default useNotificationStore;
