/**
 * AI Module — route registration.
 *
 * Mirrors the pattern of tasks.routes.ts:
 *   1. Instantiate dependencies
 *   2. Wire controller
 *   3. Register routes
 *
 * The model is null when GEMINI_API_KEY is not set; the controller and
 * service handle that case gracefully (503 response).
 */

import { Router } from 'express';
import { GenerativeModel } from '@google/generative-ai';
import { authenticate } from '@shared/middlewares/authenticate.middleware';
import { createGeminiModel } from './ai.provider';
import { AIController } from './ai.controller';
import { prisma } from '@infrastructure/database/prisma.client';

let model: GenerativeModel | null = null;

try {
  model = createGeminiModel();
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.warn(`[AI Module] Provider disabled: ${message}`);
}

const controller = new AIController(model, prisma);

const router = Router();

router.post('/chat', authenticate, controller.chat);

export { router as aiRoutes };
