import { PrismaClient, NotificationType, Prisma } from '@prisma/client';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  payload: Prisma.InputJsonValue;
}

export type NotificationsRepository = ReturnType<typeof createNotificationsRepository>;

export const createNotificationsRepository = (prisma: PrismaClient) => ({
  findByUser: (userId: string) =>
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),

  findUnreadByUser: (userId: string) =>
    prisma.notification.findMany({ where: { userId, isRead: false }, orderBy: { createdAt: 'desc' } }),

  create: (input: CreateNotificationInput) =>
    prisma.notification.create({
      data: { userId: input.userId, type: input.type, payload: input.payload },
    }),

  markAsRead: (id: string, userId: string) =>
    prisma.notification.update({ where: { id, userId }, data: { isRead: true } }),

  markAllAsRead: (userId: string) =>
    prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } }),
});
