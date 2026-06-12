import { Request, Response, NextFunction } from 'express';
import { TasksService } from './tasks.service';
import {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  CreateCommentInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
} from './tasks.dto';

export const createTasksController = (service: TasksService) => ({
  /**
   * @openapi
   * /projects/{id}/tasks:
   *   get:
   *     tags: [Tasks]
   *     summary: List tasks for a project
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *       - in: query
   *         name: assignee
   *         schema:
   *           type: string
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
   *     responses:
   *       200:
   *         description: List of tasks
   *       403:
   *         description: Access denied
   */
  findByProject: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tasks = await service.findByProject(
        req.params.id,
        req.user!.id,
        req.user!.role,
        {
          statusId: req.query.status as string | undefined,
          assigneeId: req.query.assignee as string | undefined,
          priority: req.query.priority as string | undefined,
          tag: req.query.tag as string | undefined,
          dueBefore: req.query.dueBefore as string | undefined,
        }
      );
      res.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /projects/{id}/tasks:
   *   post:
   *     tags: [Tasks]
   *     summary: Create a task in a project
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [title, statusId]
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               statusId:
   *                 type: string
   *               assigneeId:
   *                 type: string
   *               priority:
   *                 type: string
   *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
   *     responses:
   *       201:
   *         description: Task created
   *       403:
   *         description: Access denied
   */
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await service.create(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body as CreateTaskInput
      );
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /tasks/{taskId}:
   *   get:
   *     tags: [Tasks]
   *     summary: Get task details
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Task detail with comments, subtasks and history
   *       403:
   *         description: Access denied
   *       404:
   *         description: Task not found
   */
  findById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await service.findById(req.params.taskId, req.user!.id, req.user!.role);
      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /tasks/{taskId}:
   *   patch:
   *     tags: [Tasks]
   *     summary: Update a task (assignee, reporter or admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Updated task
   *       403:
   *         description: Unauthorized
   *       404:
   *         description: Task not found
   */
  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await service.update(
        req.params.taskId,
        req.user!.id,
        req.user!.role,
        req.body as UpdateTaskInput
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /tasks/{taskId}/move:
   *   patch:
   *     tags: [Tasks]
   *     summary: Move a task to a different status column
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Task moved
   *       403:
   *         description: Access denied
   */
  move: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.move(req.params.taskId, req.user!.id, req.user!.role, req.body as MoveTaskInput);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /tasks/{taskId}:
   *   delete:
   *     tags: [Tasks]
   *     summary: Delete a task (admin only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Task deleted
   *       404:
   *         description: Task not found
   */
  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.delete(req.params.taskId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /tasks/{taskId}/comments:
   *   post:
   *     tags: [Tasks]
   *     summary: Add a comment to a task
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Comment created
   *       404:
   *         description: Task not found
   */
  addComment: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comment = await service.addComment(req.params.taskId, req.user!.id, req.body as CreateCommentInput);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /tasks/{taskId}/comments:
   *   get:
   *     tags: [Tasks]
   *     summary: Get comments for a task
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of comments
   */
  getComments: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comments = await service.getComments(req.params.taskId);
      res.json({ data: comments });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /tasks/{taskId}/subtasks:
   *   post:
   *     tags: [Tasks]
   *     summary: Add a subtask
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Subtask created
   */
  addSubtask: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subtask = await service.addSubtask(req.params.taskId, req.user!.id, req.body as CreateSubtaskInput);
      res.status(201).json(subtask);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /tasks/{taskId}/subtasks/{sid}:
   *   patch:
   *     tags: [Tasks]
   *     summary: Update a subtask
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: taskId
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
   *         description: Updated subtask
   */
  updateSubtask: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subtask = await service.updateSubtask(
        req.params.taskId,
        req.params.sid,
        req.body as UpdateSubtaskInput
      );
      res.json(subtask);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @openapi
   * /tasks/{taskId}/subtasks/{sid}:
   *   delete:
   *     tags: [Tasks]
   *     summary: Delete a subtask
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: taskId
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
   *         description: Subtask deleted
   */
  deleteSubtask: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await service.deleteSubtask(req.params.taskId, req.params.sid);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
});
