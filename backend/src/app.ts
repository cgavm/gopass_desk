import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
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
import { swaggerSpec } from '@infrastructure/swagger/swagger';

const app = express();

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

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/projects', projectsRoutes);
app.use('/api/v1/projects/:id', taskProjectRoutes);
app.use('/api/v1/projects/:id/statuses', statusesRoutes);
app.use('/api/v1', taskRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ai', aiRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
