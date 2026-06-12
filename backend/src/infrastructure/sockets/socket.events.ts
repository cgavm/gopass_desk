export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_PROJECT: 'join:project',
  LEAVE_PROJECT: 'leave:project',

  // Server → Client
  TASK_MOVED: 'task:moved',
  TASK_UPDATED: 'task:updated',
  TASK_CREATED: 'task:created',
  TASK_DELETED: 'task:deleted',
  PROJECT_CREATED: 'project:created',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// Room helpers
export const roomProject = (projectId: string): string =>
  `project:${projectId}`;
export const roomUser = (userId: string): string => `user:${userId}`;
