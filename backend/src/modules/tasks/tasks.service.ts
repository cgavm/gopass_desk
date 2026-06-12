import { UserRole } from '@prisma/client';
import { prisma } from '@infrastructure/database/prisma.client';
import { logger } from '@shared/logger';
import { TasksRepository } from './tasks.repository';
import {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  CreateCommentInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
} from './tasks.dto';
import { ForbiddenError, NotFoundError } from '@shared/errors/AppError';
import { emitToProject, emitToUser } from '@infrastructure/sockets/socket.server';
import { SOCKET_EVENTS } from '@infrastructure/sockets/socket.events';
import { NotificationsRepository } from '@modules/notifications/notifications.repository';

const TRACKED_FIELDS: Record<string, string> = {
  title: 'title',
  description: 'description',
  statusId: 'status',
  assigneeId: 'assignee',
  priority: 'priority',
  dueDate: 'due date',
  startDate: 'start date',
  tags: 'tags',
};

const getAdminUserIds = async (): Promise<string[]> => {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });
  return admins.map((a) => a.id);
};

const getUserName = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return user?.name ?? 'Unknown';
};

export type TasksService = ReturnType<typeof createTasksService>;

export const createTasksService = (
  repository: TasksRepository,
  notificationsRepo: NotificationsRepository
) => ({
  findByProject: async (
    projectId: string,
    userId: string,
    userRole: UserRole,
    filters?: {
      statusId?: string;
      assigneeId?: string;
      priority?: string;
      tag?: string;
      dueBefore?: string;
    }
  ) => {
    if (userRole !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });
      if (!isMember && project?.ownerId !== userId) {
        logger.warn({ projectId, userId }, 'Access denied to project tasks');
        throw new ForbiddenError('Access denied to this project');
      }
    }
    return repository.findByProject(projectId, filters);
  },

  findById: async (taskId: string, userId: string, userRole: UserRole) => {
    const task = await repository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');

    if (userRole !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId } },
      });
      if (!isMember && task.project.ownerId !== userId) {
        logger.warn({ taskId, userId }, 'Access denied to task');
        throw new ForbiddenError('Access denied');
      }
    }

    return task;
  },

  create: async (
    projectId: string,
    reporterId: string,
    userRole: UserRole,
    input: CreateTaskInput
  ) => {
    if (userRole !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: reporterId } },
      });
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });
      if (!isMember && project?.ownerId !== reporterId) {
        logger.warn({ projectId, userId: reporterId }, 'Unauthorized task creation attempt');
        throw new ForbiddenError('Access denied to this project');
      }
    }

    const task = await repository.create({ ...input, projectId, reporterId });

    await repository.createHistory(task.id, reporterId, 'task', null, 'created');

    if (input.assigneeId) {
      const actorName = await getUserName(reporterId);
      const notification = await notificationsRepo.create({
        userId: input.assigneeId,
        type: 'TASK_ASSIGNED',
        payload: {
          taskId: task.id,
          taskTitle: task.title,
          projectId,
          assignedBy: reporterId,
          actorName,
        },
      });
      emitToUser(input.assigneeId, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
      logger.info({ taskId: task.id, assigneeId: input.assigneeId }, 'Task assignment notification sent');
    }

    logger.info({ taskId: task.id, projectId, userId: reporterId }, 'Task created');
    emitToProject(projectId, SOCKET_EVENTS.TASK_CREATED, { task, projectId });
    return task;
  },

  update: async (
    taskId: string,
    userId: string,
    userRole: UserRole,
    input: UpdateTaskInput
  ) => {
    const existing = await repository.findById(taskId);
    if (!existing) throw new NotFoundError('Task not found');

    if (userRole !== 'ADMIN') {
      const isAssignee = existing.assigneeId === userId;
      const isReporter = existing.reporterId === userId;
      if (!isAssignee && !isReporter) {
        logger.warn({ taskId, userId }, 'Unauthorized task update attempt');
        throw new ForbiddenError('Only assignee, reporter, or admin can update');
      }
    }

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const historyEntries: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];

    for (const [inputKey, label] of Object.entries(TRACKED_FIELDS)) {
      const newVal = (input as Record<string, unknown>)[inputKey];
      if (newVal === undefined) continue;
      const oldVal = (existing as Record<string, unknown>)[inputKey];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[label] = { old: oldVal, new: newVal };
        historyEntries.push({
          field: label,
          oldValue: oldVal == null ? null : String(oldVal),
          newValue: newVal == null ? null : String(newVal),
        });
      }
    }

    const task = await repository.update(taskId, input);

    for (const entry of historyEntries) {
      await repository.createHistory(taskId, userId, entry.field, entry.oldValue, entry.newValue);
    }

    if (input.assigneeId && input.assigneeId !== existing.assigneeId) {
      const actorName = await getUserName(userId);
      const notifiedUsers = new Set<string>([input.assigneeId]);
      const adminIds = await getAdminUserIds();
      adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

      for (const uid of notifiedUsers) {
        const notification = await notificationsRepo.create({
          userId: uid,
          type: 'TASK_ASSIGNED',
          payload: { taskId, taskTitle: task.title, projectId: existing.projectId, assignedBy: userId, actorName },
        });
        emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
      }
      logger.info({ taskId, notifiedCount: notifiedUsers.size }, 'Task assignment notifications sent');
    }

    if (input.statusId && input.statusId !== existing.statusId) {
      const actorName = await getUserName(userId);
      const status = await prisma.taskStatus.findUnique({ where: { id: input.statusId } });
      const notifiedUsers = new Set<string>();
      if (existing.assigneeId && existing.assigneeId !== userId) notifiedUsers.add(existing.assigneeId);
      if (existing.reporterId !== userId) notifiedUsers.add(existing.reporterId);
      const adminIds = await getAdminUserIds();
      adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

      for (const uid of notifiedUsers) {
        const notification = await notificationsRepo.create({
          userId: uid,
          type: 'STATUS_CHANGED',
          payload: { taskId, taskTitle: task.title, newStatus: status?.name ?? 'Unknown', changedBy: userId, actorName },
        });
        emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
      }
      logger.info({ taskId, statusId: input.statusId, notifiedCount: notifiedUsers.size }, 'Status change notifications sent');
    }

    logger.info({ taskId, userId, changedFields: Object.keys(changes) }, 'Task updated');
    emitToProject(existing.projectId, SOCKET_EVENTS.TASK_UPDATED, {
      taskId,
      projectId: existing.projectId,
      changes,
    });

    return task;
  },

  move: async (
    taskId: string,
    userId: string,
    userRole: UserRole,
    input: MoveTaskInput
  ) => {
    const existing = await repository.findById(taskId);
    if (!existing) throw new NotFoundError('Task not found');

    if (userRole !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: existing.projectId, userId } },
      });
      if (!isMember && existing.project.ownerId !== userId) {
        logger.warn({ taskId, userId }, 'Unauthorized task move attempt');
        throw new ForbiddenError('Access denied');
      }
    }

    const fromStatusId = existing.statusId;
    await repository.move(taskId, input.statusId, input.order);

    const status = await prisma.taskStatus.findUnique({ where: { id: input.statusId } });
    await repository.createHistory(taskId, userId, 'status', existing.status.name, status?.name ?? 'Unknown');

    if (input.statusId !== fromStatusId) {
      const actorName = await getUserName(userId);
      const notifiedUsers = new Set<string>();
      if (existing.assigneeId && existing.assigneeId !== userId) notifiedUsers.add(existing.assigneeId);
      if (existing.reporterId !== userId) notifiedUsers.add(existing.reporterId);
      const adminIds = await getAdminUserIds();
      adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

      for (const uid of notifiedUsers) {
        const notification = await notificationsRepo.create({
          userId: uid,
          type: 'STATUS_CHANGED',
          payload: { taskId, taskTitle: existing.title, newStatus: status?.name ?? 'Unknown', changedBy: userId, actorName },
        });
        emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
      }
      logger.info({ taskId, fromStatusId, toStatusId: input.statusId, notifiedCount: notifiedUsers.size }, 'Task moved notifications sent');
    }

    logger.info({ taskId, fromStatusId, toStatusId: input.statusId, userId }, 'Task moved');
    emitToProject(existing.projectId, SOCKET_EVENTS.TASK_MOVED, {
      taskId,
      fromStatusId,
      toStatusId: input.statusId,
      order: input.order,
      movedBy: userId,
    });
  },

  delete: async (taskId: string) => {
    const existing = await repository.findById(taskId);
    if (!existing) throw new NotFoundError('Task not found');
    await repository.delete(taskId);
    logger.info({ taskId, projectId: existing.projectId }, 'Task deleted');
    emitToProject(existing.projectId, SOCKET_EVENTS.TASK_DELETED, { taskId, projectId: existing.projectId });
  },

  addComment: async (taskId: string, userId: string, input: CreateCommentInput) => {
    const task = await repository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');

    const comment = await repository.addComment(taskId, userId, input.content);

    const actorName = await getUserName(userId);
    const notifiedUsers = new Set<string>();
    if (task.assigneeId && task.assigneeId !== userId) notifiedUsers.add(task.assigneeId);
    if (task.reporterId !== userId) notifiedUsers.add(task.reporterId);
    const adminIds = await getAdminUserIds();
    adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

    for (const uid of notifiedUsers) {
      const notification = await notificationsRepo.create({
        userId: uid,
        type: 'COMMENT_ADDED',
        payload: { taskId, taskTitle: task.title, projectId: task.projectId, commentId: comment.id, commentedBy: userId, actorName },
      });
      emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
    }

    logger.info({ taskId, commentId: comment.id, notifiedCount: notifiedUsers.size }, 'Comment added');
    return comment;
  },

  getComments: (taskId: string) => repository.getComments(taskId),

  addSubtask: async (taskId: string, userId: string, input: CreateSubtaskInput) => {
    const task = await repository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');

    const subtask = await repository.addSubtask(taskId, input.title);

    const actorName = await getUserName(userId);
    const notifiedUsers = new Set<string>();
    if (task.assigneeId && task.assigneeId !== userId) notifiedUsers.add(task.assigneeId);
    if (task.reporterId !== userId) notifiedUsers.add(task.reporterId);
    const adminIds = await getAdminUserIds();
    adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

    for (const uid of notifiedUsers) {
      const notification = await notificationsRepo.create({
        userId: uid,
        type: 'SUBTASK_CREATED',
        payload: { taskId, taskTitle: task.title, projectId: task.projectId, subtaskTitle: input.title, createdBy: userId, actorName },
      });
      emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
    }

    logger.info({ taskId, subtaskId: subtask.id, userId }, 'Subtask created');
    return subtask;
  },

  updateSubtask: (_taskId: string, subtaskId: string, input: UpdateSubtaskInput) =>
    repository.updateSubtask(subtaskId, input),

  deleteSubtask: (_taskId: string, subtaskId: string) =>
    repository.deleteSubtask(subtaskId),
});
