import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';

export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  findByUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notifications = await this.service.findByUser(req.user!.id);
      res.json({ data: notifications });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.markAsRead(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.markAllAsRead(req.user!.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
