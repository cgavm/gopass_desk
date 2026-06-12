import { NotificationsRepository } from './notifications.repository';

export type NotificationsService = ReturnType<typeof createNotificationsService>;

export const createNotificationsService = (repository: NotificationsRepository) => ({
  findByUser: (userId: string) => repository.findByUser(userId),
  markAsRead: (id: string, userId: string) => repository.markAsRead(id, userId),
  markAllAsRead: (userId: string) => repository.markAllAsRead(userId),
});
