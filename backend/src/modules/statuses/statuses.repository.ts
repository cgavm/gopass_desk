import { PrismaClient } from '@prisma/client';
import { CreateStatusInput, UpdateStatusInput } from './statuses.dto';

export type StatusesRepository = ReturnType<typeof createStatusesRepository>;

export const createStatusesRepository = (prisma: PrismaClient) => ({
  findByProject: (projectId: string) =>
    prisma.taskStatus.findMany({ where: { projectId }, orderBy: { order: 'asc' } }),

  findById: (id: string) =>
    prisma.taskStatus.findUnique({ where: { id } }),

  create: async (projectId: string, data: CreateStatusInput) => {
    const maxOrder = await prisma.taskStatus.aggregate({
      where: { projectId },
      _max: { order: true },
    });
    return prisma.taskStatus.create({
      data: {
        name: data.name,
        color: data.color ?? '#6B7280',
        order: data.order ?? (maxOrder._max.order ?? -1) + 1,
        projectId,
      },
    });
  },

  update: (id: string, data: UpdateStatusInput) =>
    prisma.taskStatus.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.order !== undefined && { order: data.order }),
      },
    }),

  delete: (id: string) => prisma.taskStatus.delete({ where: { id } }),

  reorder: async (projectId: string, statusIds: string[]) => {
    const updates = statusIds.map((id, index) =>
      prisma.taskStatus.update({ where: { id, projectId }, data: { order: index } })
    );
    await prisma.$transaction(updates);
  },

  countTasksUsingStatus: (statusId: string): Promise<number> =>
    prisma.task.count({ where: { statusId } }),
});
