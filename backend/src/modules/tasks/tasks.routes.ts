import { Router } from 'express';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { NotificationsRepository } from '@modules/notifications/notifications.repository';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  createCommentSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
} from './tasks.dto';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = new TasksRepository(prisma);
const notificationsRepo = new NotificationsRepository(prisma);
const service = new TasksService(repository, notificationsRepo);
const controller = new TasksController(service);

const router = Router();

// Routes scoped to a project
const projectRouter = Router({ mergeParams: true });
projectRouter.use(authenticate);
projectRouter.get('/tasks', controller.findByProject);
projectRouter.post('/tasks', validate(createTaskSchema), controller.create);

// Task-level routes
const taskRouter = Router({ mergeParams: true });
taskRouter.use(authenticate);
taskRouter.get('/tasks/:taskId', controller.findById);
taskRouter.patch('/tasks/:taskId', validate(updateTaskSchema), controller.update);
taskRouter.patch('/tasks/:taskId/move', validate(moveTaskSchema), controller.move);
taskRouter.delete('/tasks/:taskId', authorize('ADMIN'), controller.delete);

// Comments
taskRouter.post('/tasks/:taskId/comments', validate(createCommentSchema), controller.addComment);
taskRouter.get('/tasks/:taskId/comments', controller.getComments);

// Subtasks
taskRouter.post('/tasks/:taskId/subtasks', validate(createSubtaskSchema), controller.addSubtask);
taskRouter.patch('/tasks/:taskId/subtasks/:sid', validate(updateSubtaskSchema), controller.updateSubtask);
taskRouter.delete('/tasks/:taskId/subtasks/:sid', controller.deleteSubtask);

export { projectRouter as taskProjectRoutes, taskRouter as taskRoutes };
