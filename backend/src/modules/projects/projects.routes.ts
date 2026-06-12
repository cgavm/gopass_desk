import { Router } from 'express';
import { createProjectsController } from './projects.controller';
import { createProjectsService } from './projects.service';
import { createProjectsRepository } from './projects.repository';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import { asyncHandler } from '@shared/middlewares/asyncHandler.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
} from './projects.dto';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = createProjectsRepository(prisma);
const service = createProjectsService(repository);
const controller = createProjectsController(service);

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(controller.findAll));
router.post('/', validate(createProjectSchema), asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.findById));
router.patch('/:id', validate(updateProjectSchema), asyncHandler(controller.update));
router.delete('/:id', authorize('ADMIN'), asyncHandler(controller.delete));
router.post('/:id/members', validate(addMemberSchema), asyncHandler(controller.addMember));
router.delete('/:id/members/:userId', asyncHandler(controller.removeMember));
router.get('/:id/stats', asyncHandler(controller.getStats));

export { router as projectsRoutes };
