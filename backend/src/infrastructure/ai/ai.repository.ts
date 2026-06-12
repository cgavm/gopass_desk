import { PrismaClient } from '@prisma/client';

export interface TaskSummary {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  statusColor: string;
  projectName: string;
  dueDate: string | null;
  startDate: string | null;
}

function toTaskSummary(task: {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: { name: string; color: string };
  project: { name: string };
  dueDate: Date | null;
  startDate: Date | null;
}): TaskSummary {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status.name,
    statusColor: task.status.color,
    projectName: task.project.name,
    dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
    startDate: task.startDate
      ? task.startDate.toISOString().split('T')[0]
      : null,
  };
}

const taskInclude = {
  status: { select: { name: true, color: true } },
  project: { select: { name: true } },
} as const;

/** Returns all tasks where the user is the assignee. */
export async function getTasksForUser(
  prisma: PrismaClient,
  userId: string
): Promise<TaskSummary[]> {
  const tasks = await prisma.task.findMany({
    where: { assigneeId: userId },
    include: taskInclude,
    orderBy: [{ status: { order: 'asc' } }, { dueDate: 'asc' }],
  });
  return tasks.map(toTaskSummary);
}

/** Returns tasks due within the next `days` calendar days. */
export async function getUpcomingTasksForUser(
  prisma: PrismaClient,
  userId: string,
  days: number = 7
): Promise<TaskSummary[]> {
  const now = new Date();
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      dueDate: { gte: now, lte: limit },
    },
    include: taskInclude,
    orderBy: { dueDate: 'asc' },
  });
  return tasks.map(toTaskSummary);
}

/**
 * Returns tasks whose status name contains the provided term (case-insensitive).
 * Supports Spanish user input; the model resolves approximate mappings.
 */
export async function getTasksByStatusForUser(
  prisma: PrismaClient,
  userId: string,
  statusName: string
): Promise<TaskSummary[]> {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { name: { contains: statusName, mode: 'insensitive' } },
    },
    include: taskInclude,
    orderBy: { dueDate: 'asc' },
  });
  return tasks.map(toTaskSummary);
}

/** Returns the distinct status names across all the user's assigned tasks. */
export async function getAvailableStatusesForUser(
  prisma: PrismaClient,
  userId: string
): Promise<string[]> {
  const rows = await prisma.task.findMany({
    where: { assigneeId: userId },
    select: { status: { select: { name: true } } },
    distinct: ['statusId'],
  });
  return rows.map((r) => r.status.name);
}
