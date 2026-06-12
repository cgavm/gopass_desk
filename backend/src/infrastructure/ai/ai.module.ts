import { Router } from 'express';
import { GenerativeModel } from '@google/generative-ai';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { asyncHandler } from '@shared/middlewares/asyncHandler.middleware';
import { createGeminiModel } from './ai.provider';
import { createAIController } from './ai.controller';
import { prisma } from '@infrastructure/database/prisma.client';
import { logger } from '@shared/logger';

let model: GenerativeModel | null = null;

try {
  model = createGeminiModel();
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.warn(`[AI Module] Provider disabled: ${message}`);
}

const controller = createAIController(model, prisma);

const router = Router();

router.post('/chat', authenticate, asyncHandler(controller.chat));

export { router as aiRoutes };
