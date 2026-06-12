import { Router } from 'express';
import { StatusesController } from './statuses.controller';
import { StatusesService } from './statuses.service';
import { StatusesRepository } from './statuses.repository';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import {
  createStatusSchema,
  updateStatusSchema,
  reorderStatusesSchema,
} from './statuses.dto';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = new StatusesRepository(prisma);
const service = new StatusesService(repository);
const controller = new StatusesController(service);

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', controller.findByProject);
router.post('/', authorize('ADMIN'), validate(createStatusSchema), controller.create);
router.patch('/reorder', authorize('ADMIN'), validate(reorderStatusesSchema), controller.reorder);
router.patch('/:sid', authorize('ADMIN'), validate(updateStatusSchema), controller.update);
router.delete('/:sid', authorize('ADMIN'), controller.delete);

export { router as statusesRoutes };
