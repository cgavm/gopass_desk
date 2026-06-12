import { Router } from 'express';
import { createStatusesController } from './statuses.controller';
import { createStatusesService } from './statuses.service';
import { createStatusesRepository } from './statuses.repository';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import { asyncHandler } from '@shared/middlewares/asyncHandler.middleware';
import {
  createStatusSchema,
  updateStatusSchema,
  reorderStatusesSchema,
} from './statuses.dto';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = createStatusesRepository(prisma);
const service = createStatusesService(repository);
const controller = createStatusesController(service);

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', asyncHandler(controller.findByProject));
router.post('/', authorize('ADMIN'), validate(createStatusSchema), asyncHandler(controller.create));
router.patch('/reorder', authorize('ADMIN'), validate(reorderStatusesSchema), asyncHandler(controller.reorder));
router.patch('/:sid', authorize('ADMIN'), validate(updateStatusSchema), asyncHandler(controller.update));
router.delete('/:sid', authorize('ADMIN'), asyncHandler(controller.delete));

export { router as statusesRoutes };
