import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
} from './projects.dto';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = new ProjectsRepository(prisma);
const service = new ProjectsService(repository);
const controller = new ProjectsController(service);

const router = Router();

router.use(authenticate);

router.get('/', controller.findAll);
router.post('/', validate(createProjectSchema), controller.create);
router.get('/:id', controller.findById);
router.patch('/:id', validate(updateProjectSchema), controller.update);
router.delete('/:id', authorize('ADMIN'), controller.delete);
router.post('/:id/members', validate(addMemberSchema), controller.addMember);
router.delete('/:id/members/:userId', controller.removeMember);
router.get('/:id/stats', controller.getStats);

export { router as projectsRoutes };
