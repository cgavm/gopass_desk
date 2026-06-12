import { api } from './client';
import { Notification } from '@/types';

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const { data } = await api.get<{ data: Notification[] }>('/notifications');
    return data.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
