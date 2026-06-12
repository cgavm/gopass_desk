import { create } from 'zustand';
import { Notification } from '@/types';
import { notificationsApi } from '@/api/notifications.api';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetch: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const notifications = await notificationsApi.list();
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addNotification: (notification: Notification) => {
    const state = get();
    set({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    });
  },

  markAsRead: async (id: string) => {
    await notificationsApi.markAsRead(id);
    const state = get();
    const updated = state.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.isRead).length,
    });
  },

  markAllAsRead: async () => {
    await notificationsApi.markAllAsRead();
    const state = get();
    const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updated, unreadCount: 0 });
  },
}));
