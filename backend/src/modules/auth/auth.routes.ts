import { Router } from 'express';
import * as controller from './auth.controller';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authRateLimiter } from '@shared/middlewares/rateLimiter.middleware';
import { loginSchema } from './auth.dto';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), controller.login);
router.post('/refresh', authRateLimiter, controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);

export { router as authRoutes };
