import { PrismaClient, Prisma } from '@prisma/client';
import { CreateTaskInput, UpdateTaskInput } from './tasks.dto';

export type TasksRepository = ReturnType<typeof createTasksRepository>;

export const createTasksRepository = (prisma: PrismaClient) => ({
  findByProject: (
    projectId: string,
    filters?: {
      statusId?: string;
      assigneeId?: string;
      priority?: string;
      tag?: string;
      dueBefore?: string;
    }
  ) => {
    const where: Prisma.TaskWhereInput = { projectId };
    if (filters?.statusId) where.statusId = filters.statusId;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.priority) where.priority = filters.priority as Prisma.EnumTaskPriorityFilter;
    if (filters?.tag) where.tags = { has: filters.tag };
    if (filters?.dueBefore) where.dueDate = { lte: new Date(filters.dueBefore) };

    return prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true } },
        status: true,
        subtasks: true,
        _count: { select: { comments: true } },
      },
      orderBy: [{ status: { order: 'asc' } }, { order: 'asc' }],
    });
  },

  findById: (taskId: string) =>
    prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
        status: true,
        project: { select: { id: true, name: true, ownerId: true } },
        subtasks: { orderBy: { order: 'asc' } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        history: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { changedAt: 'desc' },
        },
      },
    }),

  create: (data: CreateTaskInput & { projectId: string; reporterId: string }) =>
    prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        statusId: data.statusId,
        projectId: data.projectId,
        reporterId: data.reporterId,
        assigneeId: data.assigneeId,
        priority: data.priority,
        tags: data.tags ?? [],
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        order: 0,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true } },
        status: true,
      },
    }),

  update: (taskId: string, data: UpdateTaskInput) => {
    const updateData: Prisma.TaskUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.statusId !== undefined) updateData.status = { connect: { id: data.statusId } };
    if (data.assigneeId !== undefined) {
      updateData.assignee = data.assigneeId
        ? { connect: { id: data.assigneeId } }
        : { disconnect: true };
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true } },
        status: true,
      },
    });
  },

  delete: (taskId: string) => prisma.task.delete({ where: { id: taskId } }),

  move: (taskId: string, statusId: string, order: number) =>
    prisma.task.update({ where: { id: taskId }, data: { statusId, order } }),

  createHistory: (
    taskId: string,
    userId: string,
    field: string,
    oldValue: string | null,
    newValue: string | null
  ) =>
    prisma.taskHistory.create({ data: { taskId, userId, field, oldValue, newValue } }),

  getHistory: (taskId: string) =>
    prisma.taskHistory.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { changedAt: 'desc' },
    }),

  addComment: (taskId: string, userId: string, content: string) =>
    prisma.taskComment.create({
      data: { taskId, userId, content },
      include: { user: { select: { id: true, name: true } } },
    }),

  getComments: (taskId: string) =>
    prisma.taskComment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    }),

  addSubtask: async (taskId: string, title: string) => {
    const maxOrder = await prisma.subtask.aggregate({
      where: { taskId },
      _max: { order: true },
    });
    return prisma.subtask.create({
      data: { taskId, title, order: (maxOrder._max.order ?? -1) + 1 },
    });
  },

  updateSubtask: (subtaskId: string, data: { title?: string; isCompleted?: boolean }) =>
    prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      },
    }),

  deleteSubtask: (subtaskId: string) =>
    prisma.subtask.delete({ where: { id: subtaskId } }),
});
