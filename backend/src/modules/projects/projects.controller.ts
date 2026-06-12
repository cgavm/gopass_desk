import { Request, Response, NextFunction } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectInput, UpdateProjectInput, AddMemberInput } from './projects.dto';

export const createProjectsController = (service: ProjectsService) => ({
  /**
   * @openapi
   * /projects:
   *   get:
   *     tags: [Projects]
   *     summary: List all projects
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Array of projects
   */
  findAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projects = await service.findAll(req.user!.id, req.user!.role);
      res.json({ data: projects });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects:
   *   post:
   *     tags: [Projects]
   *     summary: Create a new project
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [ACTIVE, ARCHIVED]
   *     responses:
   *       201:
   *         description: Project created
   */
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await service.create(req.user!.id, req.body as CreateProjectInput);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}:
   *   get:
   *     tags: [Projects]
   *     summary: Get project by ID
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
   *         description: Project details
   *       403:
   *         description: Access denied
   *       404:
   *         description: Project not found
   */
  findById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await service.findById(req.params.id, req.user!.id, req.user!.role);
      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}:
   *   patch:
   *     tags: [Projects]
   *     summary: Update project (owner or admin)
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
   *         description: Updated project
   *       403:
   *         description: Only owner or admin allowed
   *       404:
   *         description: Project not found
   */
  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await service.update(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body as UpdateProjectInput
      );
      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}:
   *   delete:
   *     tags: [Projects]
   *     summary: Delete project (admin only)
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
   *         description: Project deleted
   *       404:
   *         description: Project not found
   */
  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}/members:
   *   post:
   *     tags: [Projects]
   *     summary: Add member to project (owner or admin)
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
   *         description: Member added
   *       409:
   *         description: User already a member
   */
  addMember: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.addMember(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body as AddMemberInput
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}/members/{userId}:
   *   delete:
   *     tags: [Projects]
   *     summary: Remove member from project (owner or admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Member removed
   */
  removeMember: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.removeMember(
        req.params.id,
        req.params.userId,
        req.user!.id,
        req.user!.role
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}/stats:
   *   get:
   *     tags: [Projects]
   *     summary: Get task statistics for a project
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
   *         description: Project task stats
   *       403:
   *         description: Access denied
   */
  getStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await service.getStats(req.params.id, req.user!.id, req.user!.role);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },
});
