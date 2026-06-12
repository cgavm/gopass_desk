import { Router } from 'express';
import { createUsersController } from './users.controller';
import { createUsersService } from './users.service';
import { createUsersRepository } from './users.repository';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import { asyncHandler } from '@shared/middlewares/asyncHandler.middleware';
import { createUserSchema, updateUserSchema } from './users.dto';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = createUsersRepository(prisma);
const service = createUsersService(repository);
const controller = createUsersController(service);

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', asyncHandler(controller.findAll));
router.post('/', validate(createUserSchema), asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.findById));
router.patch('/:id', validate(updateUserSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.deactivate));

export { router as usersRoutes };
