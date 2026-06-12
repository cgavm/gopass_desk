import { Router } from 'express';
import { createNotificationsController } from './notifications.controller';
import { createNotificationsService } from './notifications.service';
import { createNotificationsRepository } from './notifications.repository';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { asyncHandler } from '@shared/middlewares/asyncHandler.middleware';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = createNotificationsRepository(prisma);
const service = createNotificationsService(repository);
const controller = createNotificationsController(service);

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(controller.findByUser));
router.patch('/:id/read', asyncHandler(controller.markAsRead));
router.patch('/read-all', asyncHandler(controller.markAllAsRead));

export { router as notificationsRoutes };
