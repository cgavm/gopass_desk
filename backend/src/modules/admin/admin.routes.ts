import { Router } from 'express';
import { createAdminController } from './admin.controller';
import { createAdminService } from './admin.service';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import { asyncHandler } from '@shared/middlewares/asyncHandler.middleware';
import { prisma } from '@infrastructure/database/prisma.client';

const service = createAdminService(prisma);
const controller = createAdminController(service);

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/stats', asyncHandler(controller.getStats));

export { router as adminRoutes };
