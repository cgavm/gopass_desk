import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { authRoutes } from '@modules/auth/auth.routes';
import { usersRoutes } from '@modules/users/users.routes';
import { projectsRoutes } from '@modules/projects/projects.routes';
import { statusesRoutes } from '@modules/statuses/statuses.routes';
import { taskProjectRoutes, taskRoutes } from '@modules/tasks/tasks.routes';
import { notificationsRoutes } from '@modules/notifications/notifications.routes';
import { adminRoutes } from '@modules/admin/admin.routes';
import { aiRoutes } from '@infrastructure/ai/ai.module';
import { errorHandler, notFoundHandler } from '@shared/middlewares/errorHandler.middleware';
import { requestLogger } from '@shared/middlewares/requestLogger.middleware';
import { globalRateLimiter } from '@shared/middlewares/rateLimiter.middleware';

const app = express();

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: (process.env.ALLOWED_ORIGINS ?? '').split(','),
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(globalRateLimiter);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/projects', projectsRoutes);
app.use('/api/v1/projects/:id', taskProjectRoutes);
app.use('/api/v1/projects/:id/statuses', statusesRoutes);
app.use('/api/v1', taskRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ai', aiRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
