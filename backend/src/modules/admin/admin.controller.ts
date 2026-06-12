import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';

export const createAdminController = (service: AdminService) => ({
  /**
   * @openapi
   * /admin/stats:
   *   get:
   *     tags: [Admin]
   *     summary: Get global platform statistics (admin only)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Platform-wide stats including projects, tasks, and users
   *       403:
   *         description: Admin role required
   */
  getStats: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await service.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },
});
