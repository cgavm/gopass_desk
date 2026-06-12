import { UserRole } from '@prisma/client';
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
import { prisma } from '@infrastructure/database/prisma.client';
import { emitToProject, emitToUser } from '@infrastructure/sockets/socket.server';
import { SOCKET_EVENTS } from '@infrastructure/sockets/socket.events';
import { NotificationsRepository } from '@modules/notifications/notifications.repository';

// Fields to track in history
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

// Issue #6/#7: Helper to get all admin user IDs for broadcasting notifications
async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });
  return admins.map((a) => a.id);
}

// Issue #5: Helper to get user name from userId
async function getUserName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return user?.name ?? 'Unknown';
}

export class TasksService {
  constructor(
    private readonly repository: TasksRepository,
    private readonly notificationsRepo: NotificationsRepository
  ) {}

  async findByProject(
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
  ) {
    // Verify membership
    if (userRole !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });
      if (!isMember && project?.ownerId !== userId) {
        throw new ForbiddenError('Access denied to this project');
      }
    }

    return this.repository.findByProject(projectId, filters);
  }

  async findById(taskId: string, userId: string, userRole: UserRole) {
    const task = await this.repository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');

    if (userRole !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId } },
      });
      if (!isMember && task.project.ownerId !== userId) {
        throw new ForbiddenError('Access denied');
      }
    }

    return task;
  }

  async create(
    projectId: string,
    reporterId: string,
    userRole: UserRole,
    input: CreateTaskInput
  ) {
    if (userRole !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: reporterId } },
      });
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });
      if (!isMember && project?.ownerId !== reporterId) {
        throw new ForbiddenError('Access denied to this project');
      }
    }

    const task = await this.repository.create({
      ...input,
      projectId,
      reporterId,
    });

    // Create history entry
    await this.repository.createHistory(
      task.id,
      reporterId,
      'task',
      null,
      'created'
    );

    // Issue #5: Include actor name in notification payload
    if (input.assigneeId) {
      const actorName = await getUserName(reporterId);
      const notification = await this.notificationsRepo.create({
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
    }

    emitToProject(projectId, SOCKET_EVENTS.TASK_CREATED, { task, projectId });

    return task;
  }

  async update(
    taskId: string,
    userId: string,
    userRole: UserRole,
    input: UpdateTaskInput
  ) {
    const existing = await this.repository.findById(taskId);
    if (!existing) throw new NotFoundError('Task not found');

    // Authorization
    if (userRole !== 'ADMIN') {
      const isAssignee = existing.assigneeId === userId;
      const isReporter = existing.reporterId === userId;
      if (!isAssignee && !isReporter) {
        throw new ForbiddenError('Only assignee, reporter, or admin can update');
      }
    }

    // Build history entries for changed fields
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const historyEntries: Array<{
      field: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    for (const [inputKey, label] of Object.entries(TRACKED_FIELDS)) {
      const newVal = (input as Record<string, unknown>)[inputKey];
      if (newVal === undefined) continue;

      const oldVal = (existing as Record<string, unknown>)[inputKey];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[label] = {
          old: oldVal,
          new: newVal,
        };
        historyEntries.push({
          field: label,
          oldValue: oldVal == null ? null : String(oldVal),
          newValue: newVal == null ? null : String(newVal),
        });
      }
    }

    const task = await this.repository.update(taskId, input);

    // Create history entries
    for (const entry of historyEntries) {
      await this.repository.createHistory(
        taskId,
        userId,
        entry.field,
        entry.oldValue,
        entry.newValue
      );
    }

    // Issue #5/#7: Notify on assignment change — only assignee + admins
    if (input.assigneeId && input.assigneeId !== existing.assigneeId) {
      const actorName = await getUserName(userId);
      const notifiedUsers = new Set<string>([input.assigneeId]);
      const adminIds = await getAdminUserIds();
      adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

      for (const uid of notifiedUsers) {
        const notification = await this.notificationsRepo.create({
          userId: uid,
          type: 'TASK_ASSIGNED',
          payload: {
            taskId,
            taskTitle: task.title,
            projectId: existing.projectId,
            assignedBy: userId,
            actorName,
          },
        });
        emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
      }
    }

    // Issue #7: Notify on status change — assignee + reporter + admins (not actor)
    if (input.statusId && input.statusId !== existing.statusId) {
      const actorName = await getUserName(userId);
      const status = await prisma.taskStatus.findUnique({
        where: { id: input.statusId },
      });
      const notifiedUsers = new Set<string>();
      if (existing.assigneeId && existing.assigneeId !== userId) {
        notifiedUsers.add(existing.assigneeId);
      }
      if (existing.reporterId !== userId) notifiedUsers.add(existing.reporterId);
      const adminIds = await getAdminUserIds();
      adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

      for (const uid of notifiedUsers) {
        const notification = await this.notificationsRepo.create({
          userId: uid,
          type: 'STATUS_CHANGED',
          payload: {
            taskId,
            taskTitle: task.title,
            newStatus: status?.name ?? 'Unknown',
            changedBy: userId,
            actorName,
          },
        });
        emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
      }
    }

    emitToProject(existing.projectId, SOCKET_EVENTS.TASK_UPDATED, {
      taskId,
      projectId: existing.projectId,
      changes,
    });

    return task;
  }

  async move(
    taskId: string,
    userId: string,
    userRole: UserRole,
    input: MoveTaskInput
  ) {
    const existing = await this.repository.findById(taskId);
    if (!existing) throw new NotFoundError('Task not found');

    if (userRole !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: existing.projectId, userId } },
      });
      if (!isMember && existing.project.ownerId !== userId) {
        throw new ForbiddenError('Access denied');
      }
    }

    const fromStatusId = existing.statusId;
    await this.repository.move(taskId, input.statusId, input.order);

    // History
    const status = await prisma.taskStatus.findUnique({
      where: { id: input.statusId },
    });
    await this.repository.createHistory(
      taskId,
      userId,
      'status',
      existing.status.name,
      status?.name ?? 'Unknown'
    );

    // Issue #5/#7: Notify status change — assignee + reporter + admins (not actor)
    if (input.statusId !== fromStatusId) {
      const actorName = await getUserName(userId);
      const notifiedUsers = new Set<string>();
      if (existing.assigneeId && existing.assigneeId !== userId) {
        notifiedUsers.add(existing.assigneeId);
      }
      if (existing.reporterId !== userId) notifiedUsers.add(existing.reporterId);
      const adminIds = await getAdminUserIds();
      adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

      for (const uid of notifiedUsers) {
        const notification = await this.notificationsRepo.create({
          userId: uid,
          type: 'STATUS_CHANGED',
          payload: {
            taskId,
            taskTitle: existing.title,
            newStatus: status?.name ?? 'Unknown',
            changedBy: userId,
            actorName,
          },
        });
        emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
      }
    }

    emitToProject(existing.projectId, SOCKET_EVENTS.TASK_MOVED, {
      taskId,
      fromStatusId,
      toStatusId: input.statusId,
      order: input.order,
      movedBy: userId,
    });
  }

  async delete(taskId: string) {
    const existing = await this.repository.findById(taskId);
    if (!existing) throw new NotFoundError('Task not found');

    await this.repository.delete(taskId);

    emitToProject(existing.projectId, SOCKET_EVENTS.TASK_DELETED, {
      taskId,
      projectId: existing.projectId,
    });
  }

  // Comments
  async addComment(
    taskId: string,
    userId: string,
    input: CreateCommentInput
  ) {
    const task = await this.repository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');

    const comment = await this.repository.addComment(taskId, userId, input.content);

    // Issue #5/#6/#7: Include actorName in payload; notify reporter, assignee AND all admins
    const actorName = await getUserName(userId);
    const notifiedUsers = new Set<string>();
    if (task.assigneeId && task.assigneeId !== userId) notifiedUsers.add(task.assigneeId);
    if (task.reporterId !== userId) notifiedUsers.add(task.reporterId);

    // Issue #6: Admin always gets comment notifications
    const adminIds = await getAdminUserIds();
    adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

    for (const uid of notifiedUsers) {
      const notification = await this.notificationsRepo.create({
        userId: uid,
        type: 'COMMENT_ADDED',
        payload: {
          taskId,
          taskTitle: task.title,
          projectId: task.projectId,
          commentId: comment.id,
          commentedBy: userId,
          actorName,
        },
      });
      emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
    }

    return comment;
  }

  async getComments(taskId: string) {
    return this.repository.getComments(taskId);
  }

  // Subtasks
  async addSubtask(taskId: string, userId: string, input: CreateSubtaskInput) {
    const task = await this.repository.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');

    const subtask = await this.repository.addSubtask(taskId, input.title);

    // Issue #6: Notify on subtask creation — reporter, assignee, admins (not actor)
    const actorName = await getUserName(userId);
    const notifiedUsers = new Set<string>();
    if (task.assigneeId && task.assigneeId !== userId) notifiedUsers.add(task.assigneeId);
    if (task.reporterId !== userId) notifiedUsers.add(task.reporterId);
    const adminIds = await getAdminUserIds();
    adminIds.filter((id) => id !== userId).forEach((id) => notifiedUsers.add(id));

    for (const uid of notifiedUsers) {
      const notification = await this.notificationsRepo.create({
        userId: uid,
        type: 'SUBTASK_CREATED',
        payload: {
          taskId,
          taskTitle: task.title,
          projectId: task.projectId,
          subtaskTitle: input.title,
          createdBy: userId,
          actorName,
        },
      });
      emitToUser(uid, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
    }

    return subtask;
  }

  async updateSubtask(
    _taskId: string,
    subtaskId: string,
    input: UpdateSubtaskInput
  ) {
    return this.repository.updateSubtask(subtaskId, input);
  }

  async deleteSubtask(_taskId: string, subtaskId: string) {
    return this.repository.deleteSubtask(subtaskId);
  }
}
