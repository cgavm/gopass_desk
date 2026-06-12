import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationsStore } from '@/store/notifications.store';
import { Notification } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const addNotification = useNotificationsStore((s) => s.addNotification);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.debug('Socket connected');
    });

    socket.on('notification:new', ({ notification }: { notification: Notification }) => {
      addNotification(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [addNotification]);

  const joinProject = (projectId: string) => {
    socketRef.current?.emit('join:project', { projectId });
  };

  const leaveProject = (projectId: string) => {
    socketRef.current?.emit('leave:project', { projectId });
  };

  const onTaskMoved = (handler: (data: unknown) => void) => {
    socketRef.current?.on('task:moved', handler);
    return () => socketRef.current?.off('task:moved', handler);
  };

  const onTaskUpdated = (handler: (data: unknown) => void) => {
    socketRef.current?.on('task:updated', handler);
    return () => socketRef.current?.off('task:updated', handler);
  };

  const onTaskCreated = (handler: (data: unknown) => void) => {
    socketRef.current?.on('task:created', handler);
    return () => socketRef.current?.off('task:created', handler);
  };

  const onTaskDeleted = (handler: (data: unknown) => void) => {
    socketRef.current?.on('task:deleted', handler);
    return () => socketRef.current?.off('task:deleted', handler);
  };

  // Issue #3: Listen for new projects created by any user
  const onProjectCreated = (handler: (data: unknown) => void) => {
    socketRef.current?.on('project:created', handler);
    return () => socketRef.current?.off('project:created', handler);
  };

  return {
    socket: socketRef.current,
    joinProject,
    leaveProject,
    onTaskMoved,
    onTaskUpdated,
    onTaskCreated,
    onTaskDeleted,
    onProjectCreated,
  };
}
