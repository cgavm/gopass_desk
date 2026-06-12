import { Router } from 'express';
import { createTasksController } from './tasks.controller';
import { createTasksService } from './tasks.service';
import { createTasksRepository } from './tasks.repository';
import { createNotificationsRepository } from '@modules/notifications/notifications.repository';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import { asyncHandler } from '@shared/middlewares/asyncHandler.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  createCommentSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
} from './tasks.dto';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = createTasksRepository(prisma);
const notificationsRepo = createNotificationsRepository(prisma);
const service = createTasksService(repository, notificationsRepo);
const controller = createTasksController(service);

const projectRouter = Router({ mergeParams: true });
projectRouter.use(authenticate);
projectRouter.get('/tasks', asyncHandler(controller.findByProject));
projectRouter.post('/tasks', validate(createTaskSchema), asyncHandler(controller.create));

const taskRouter = Router({ mergeParams: true });
taskRouter.use(authenticate);
taskRouter.get('/tasks/:taskId', asyncHandler(controller.findById));
taskRouter.patch('/tasks/:taskId', validate(updateTaskSchema), asyncHandler(controller.update));
taskRouter.patch('/tasks/:taskId/move', validate(moveTaskSchema), asyncHandler(controller.move));
taskRouter.delete('/tasks/:taskId', authorize('ADMIN'), asyncHandler(controller.delete));

taskRouter.post('/tasks/:taskId/comments', validate(createCommentSchema), asyncHandler(controller.addComment));
taskRouter.get('/tasks/:taskId/comments', asyncHandler(controller.getComments));

taskRouter.post('/tasks/:taskId/subtasks', validate(createSubtaskSchema), asyncHandler(controller.addSubtask));
taskRouter.patch('/tasks/:taskId/subtasks/:sid', validate(updateSubtaskSchema), asyncHandler(controller.updateSubtask));
taskRouter.delete('/tasks/:taskId/subtasks/:sid', asyncHandler(controller.deleteSubtask));

export { projectRouter as taskProjectRoutes, taskRouter as taskRoutes };
