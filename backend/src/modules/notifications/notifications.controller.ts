import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';

export const createNotificationsController = (service: NotificationsService) => ({
  /**
   * @openapi
   * /notifications:
   *   get:
   *     tags: [Notifications]
   *     summary: Get notifications for the current user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of notifications
   */
  findByUser: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notifications = await service.findByUser(req.user!.id);
      res.json({ data: notifications });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /notifications/{id}/read:
   *   patch:
   *     tags: [Notifications]
   *     summary: Mark a notification as read
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Marked as read
   */
  markAsRead: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.markAsRead(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /notifications/read-all:
   *   patch:
   *     tags: [Notifications]
   *     summary: Mark all notifications as read
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       204:
   *         description: All notifications marked as read
   */
  markAllAsRead: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.markAllAsRead(req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
});
