import { PrismaClient, Project, ProjectStatus } from '@prisma/client';
import { CreateProjectInput, UpdateProjectInput } from './projects.dto';

export class ProjectsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<any[]> {
    return this.prisma.project.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string): Promise<any[]> {
    return this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        statuses: { orderBy: { order: 'asc' } },
        _count: { select: { tasks: true } },
      },
    });
  }

  async create(ownerId: string, data: CreateProjectInput): Promise<Project> {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status ?? ProjectStatus.ACTIVE,
        ownerId,
      },
    });
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }

  async addMember(projectId: string, userId: string): Promise<void> {
    await this.prisma.projectMember.create({
      data: { projectId, userId },
    });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
    return member !== null;
  }

  async getTaskStats(projectId: string) {
    const [total, completed, byStatus] = await Promise.all([
      this.prisma.task.count({ where: { projectId } }),
      this.prisma.task.count({
        where: {
          projectId,
          status: { isDefault: true },
        },
      }),
      this.prisma.task.groupBy({
        by: ['statusId'],
        where: { projectId },
        _count: true,
      }),
    ]);

    // Get completed count by checking status name
    const completedStatus = await this.prisma.taskStatus.findFirst({
      where: { projectId, name: 'COMPLETED' },
    });

    const completedCount = completedStatus
      ? await this.prisma.task.count({
          where: { projectId, statusId: completedStatus.id },
        })
      : 0;

    const overdue = await this.prisma.task.count({
      where: {
        projectId,
        dueDate: { lt: new Date() },
      },
    });

    return {
      total,
      completed: completedCount,
      overdue,
      progress: total === 0 ? 0 : Math.round((completedCount / total) * 100),
      byStatus,
    };
  }
}
