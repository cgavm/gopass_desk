/**
 * AI Controller — HTTP layer only.
 *
 * Validates the request body and delegates to the service.
 * Does not contain any business logic or data access.
 */

import { Request, Response, NextFunction } from 'express';
import { GenerativeModel } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { runChat } from './ai.service';
import { AIMessage } from './ai.port';

const chatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(50),
});

export class AIController {
  constructor(
    private readonly model: GenerativeModel | null,
    private readonly prisma: PrismaClient
  ) {}

  chat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const parsed = chatBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Formato de mensajes inválido.',
        details: parsed.error.flatten(),
        statusCode: 400,
      });
      return;
    }

    try {
      const result = await runChat(
        this.model,
        this.prisma,
        req.user!.id,
        parsed.data.messages as AIMessage[]
      );

      if (!result.ok) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: result.message,
          statusCode: 503,
        });
        return;
      }

      res.json({ reply: result.reply, statusCode: 200 });
    } catch {
      next(
        Object.assign(new Error('AI service error'), {
          statusCode: 503,
          message:
            'El asistente de IA no está disponible en este momento. Por favor, intenta más tarde.',
        })
      );
    }
  };
}
