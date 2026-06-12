import { NotificationsRepository } from './notifications.repository';

export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async findByUser(userId: string) {
    return this.repository.findByUser(userId);
  }

  async markAsRead(id: string, userId: string) {
    return this.repository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.repository.markAllAsRead(userId);
  }
}
