import { Router } from 'express';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import { prisma } from '@infrastructure/database/prisma.client';

const service = new AdminService(prisma);
const controller = new AdminController(service);

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/stats', controller.getStats);

export { router as adminRoutes };
