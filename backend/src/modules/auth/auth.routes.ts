import { Router } from 'express';
import * as controller from './auth.controller';
import { validate } from '@shared/validators/validate';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { authRateLimiter } from '@shared/middlewares/rateLimiter.middleware';
import { asyncHandler } from '@shared/middlewares/asyncHandler.middleware';
import { loginSchema } from './auth.dto';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(controller.login));
router.post('/refresh', authRateLimiter, asyncHandler(controller.refresh));
router.post('/logout', authenticate, asyncHandler(controller.logout));
router.get('/me', authenticate, asyncHandler(controller.me));

export { router as authRoutes };
