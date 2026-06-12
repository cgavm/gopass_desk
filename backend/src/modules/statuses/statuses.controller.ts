import { Request, Response, NextFunction } from 'express';
import { StatusesService } from './statuses.service';
import { CreateStatusInput, UpdateStatusInput, ReorderStatusesInput } from './statuses.dto';

export const createStatusesController = (service: StatusesService) => ({
  /**
   * @openapi
   * /projects/{id}/statuses:
   *   get:
   *     tags: [Statuses]
   *     summary: List statuses for a project
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of task statuses
   */
  findByProject: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statuses = await service.findByProject(req.params.id);
      res.json({ data: statuses });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}/statuses:
   *   post:
   *     tags: [Statuses]
   *     summary: Create a status in a project (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Status created
   */
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await service.create(req.params.id, req.body as CreateStatusInput);
      res.status(201).json(status);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}/statuses/{sid}:
   *   patch:
   *     tags: [Statuses]
   *     summary: Update a status (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: sid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Updated status
   *       404:
   *         description: Status not found
   */
  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await service.update(req.params.id, req.params.sid, req.body as UpdateStatusInput);
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}/statuses/{sid}:
   *   delete:
   *     tags: [Statuses]
   *     summary: Delete a status (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: sid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Status deleted
   *       400:
   *         description: Status has tasks assigned
   */
  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.delete(req.params.id, req.params.sid);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}/statuses/reorder:
   *   patch:
   *     tags: [Statuses]
   *     summary: Reorder statuses in a project (admin only)
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
   *         description: Statuses reordered
   */
  reorder: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.reorder(req.params.id, req.body as ReorderStatusesInput);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
});
