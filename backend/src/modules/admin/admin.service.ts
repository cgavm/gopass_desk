import { PrismaClient } from '@prisma/client';
import { logger } from '@shared/logger';

export type AdminService = ReturnType<typeof createAdminService>;

export const createAdminService = (prisma: PrismaClient) => ({
  getStats: async () => {
    const [
      totalProjects,
      totalTasks,
      totalUsers,
      activeUsers,
      tasksByStatus,
      overdueTasks,
      recentProjects,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.task.groupBy({ by: ['priority'], _count: true }),
      prisma.task.count({ where: { dueDate: { lt: new Date() } } }),
      prisma.project.findMany({
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

    logger.info({ totalProjects, totalTasks, totalUsers }, 'Admin stats queried');

    return {
      totalProjects,
      totalTasks,
      totalUsers,
      activeUsers,
      tasksByStatus,
      overdueTasks,
      recentProjects,
    };
  },
});
