import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '@shared/logger';
import { SOCKET_EVENTS, roomProject, roomUser } from './socket.events';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface JwtPayload {
  sub: string;
  role: string;
}

let io: SocketIOServer | null = null;

export function initializeSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS ?? '').split(','),
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const rawToken =
        (socket.handshake.auth as Record<string, unknown>)?.token ??
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      const token = typeof rawToken === 'string' ? rawToken : null;

      if (!token) {
        return next(new Error('Authentication error: token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET ?? ''
      ) as JwtPayload;

      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info({ userId: socket.userId, socketId: socket.id }, 'Socket connected');

    if (socket.userId) {
      void socket.join(roomUser(socket.userId));
    }

    socket.on(SOCKET_EVENTS.JOIN_PROJECT, ({ projectId }: { projectId: string }) => {
      void socket.join(roomProject(projectId));
      logger.debug({ userId: socket.userId, projectId }, 'Joined project room');
    });

    socket.on(SOCKET_EVENTS.LEAVE_PROJECT, ({ projectId }: { projectId: string }) => {
      void socket.leave(roomProject(projectId));
      logger.debug({ userId: socket.userId, projectId }, 'Left project room');
    });

    socket.on('disconnect', () => {
      logger.info({ userId: socket.userId, socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
}

export function emitToProject<T>(projectId: string, event: string, data: T): void {
  if (!io) return;
  io.to(roomProject(projectId)).emit(event, data);
}

export function emitToUser<T>(userId: string, event: string, data: T): void {
  if (!io) return;
  io.to(roomUser(userId)).emit(event, data);
}

export function emitToAll<T>(event: string, data: T): void {
  if (!io) return;
  io.emit(event, data);
}
