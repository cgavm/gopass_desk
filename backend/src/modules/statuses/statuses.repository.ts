import { PrismaClient } from '@prisma/client';
import { CreateStatusInput, UpdateStatusInput } from './statuses.dto';

export class StatusesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByProject(projectId: string) {
    return this.prisma.taskStatus.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.taskStatus.findUnique({
      where: { id },
    });
  }

  async create(projectId: string, data: CreateStatusInput) {
    const maxOrder = await this.prisma.taskStatus.aggregate({
      where: { projectId },
      _max: { order: true },
    });

    return this.prisma.taskStatus.create({
      data: {
        name: data.name,
        color: data.color ?? '#6B7280',
        order: data.order ?? (maxOrder._max.order ?? -1) + 1,
        projectId,
      },
    });
  }

  async update(id: string, data: UpdateStatusInput) {
    return this.prisma.taskStatus.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.taskStatus.delete({
      where: { id },
    });
  }

  async reorder(projectId: string, statusIds: string[]) {
    const updates = statusIds.map((id, index) =>
      this.prisma.taskStatus.update({
        where: { id, projectId },
        data: { order: index },
      })
    );
    await this.prisma.$transaction(updates);
  }

  async countTasksUsingStatus(statusId: string): Promise<number> {
    return this.prisma.task.count({
      where: { statusId },
    });
  }
}
