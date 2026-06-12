import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';

export class AdminController {
  constructor(private readonly service: AdminService) {}

  getStats = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };
}
