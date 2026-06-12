import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = new NotificationsRepository(prisma);
const service = new NotificationsService(repository);
const controller = new NotificationsController(service);

const router = Router();

router.use(authenticate);
router.get('/', controller.findByUser);
router.patch('/:id/read', controller.markAsRead);
router.patch('/read-all', controller.markAllAsRead);

export { router as notificationsRoutes };
