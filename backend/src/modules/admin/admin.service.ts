import { PrismaClient } from '@prisma/client';

export class AdminService {
  constructor(private readonly prisma: PrismaClient) {}

  async getStats() {
    const [
      totalProjects,
      totalTasks,
      totalUsers,
      activeUsers,
      tasksByStatus,
      overdueTasks,
      recentProjects,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.task.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.task.groupBy({
        by: ['priority'],
        _count: true,
      }),
      this.prisma.task.count({
        where: {
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          _count: { select: { tasks: true } },
        },
      }),
    ]);

    return {
      totalProjects,
      totalTasks,
      totalUsers,
      activeUsers,
      tasksByStatus,
      overdueTasks,
      recentProjects,
    };
  }
}
