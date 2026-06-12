import { Router } from 'express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authorize } from '@shared/middlewares/authorize.middleware';
import { createUserSchema, updateUserSchema } from './users.dto';
import { prisma } from '@infrastructure/database/prisma.client';

const repository = new UsersRepository(prisma);
const service = new UsersService(repository);
const controller = new UsersController(service);

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', controller.findAll);
router.post('/', validate(createUserSchema), controller.create);
router.get('/:id', controller.findById);
router.patch('/:id', validate(updateUserSchema), controller.update);
router.delete('/:id', controller.deactivate);

export { router as usersRoutes };
