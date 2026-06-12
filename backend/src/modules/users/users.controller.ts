import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { CreateUserInput, UpdateUserInput } from './users.dto';

export const createUsersController = (service: UsersService) => ({
  /**
   * @openapi
   * /users:
   *   get:
   *     tags: [Users]
   *     summary: List all users (admin only)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of users
   */
  findAll: async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const users = await service.findAll();
      res.json({ data: users });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /users:
   *   post:
   *     tags: [Users]
   *     summary: Create a new user (admin only)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserInput'
   *     responses:
   *       201:
   *         description: User created
   *       409:
   *         description: Email already in use
   */
  create: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await service.create(req.body as CreateUserInput);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /users/{id}:
   *   get:
   *     tags: [Users]
   *     summary: Get user by ID (admin only)
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
   *         description: User data
   *       404:
   *         description: User not found
   */
  findById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await service.findById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /users/{id}:
   *   patch:
   *     tags: [Users]
   *     summary: Update user (admin only)
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
   *         description: Updated user
   *       404:
   *         description: User not found
   */
  update: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await service.update(req.params.id, req.body as UpdateUserInput);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /users/{id}:
   *   delete:
   *     tags: [Users]
   *     summary: Deactivate user (admin only)
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
   *         description: User deactivated
   *       404:
   *         description: User not found
   */
  deactivate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await service.deactivate(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },
});
