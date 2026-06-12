import { PrismaClient, Project, ProjectStatus } from '@prisma/client';
import { CreateProjectInput, UpdateProjectInput } from './projects.dto';

export type ProjectsRepository = ReturnType<typeof createProjectsRepository>;

const ownerSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const createProjectsRepository = (prisma: PrismaClient) => ({
  findAll: (): Promise<any[]> => // eslint-disable-line @typescript-eslint/no-explicit-any
    prisma.project.findMany({
      include: {
        owner: { select: ownerSelect },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

  findByUser: (userId: string): Promise<any[]> => // eslint-disable-line @typescript-eslint/no-explicit-any
    prisma.project.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
      include: {
        owner: { select: ownerSelect },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

  findById: (id: string): Promise<any> => // eslint-disable-line @typescript-eslint/no-explicit-any
    prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: ownerSelect },
        members: {
          include: { user: { select: ownerSelect } },
        },
        statuses: { orderBy: { order: 'asc' } },
        _count: { select: { tasks: true } },
      },
    }),

  create: (ownerId: string, data: CreateProjectInput): Promise<Project> =>
    prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status ?? ProjectStatus.ACTIVE,
        ownerId,
      },
    }),

  update: (id: string, data: UpdateProjectInput): Promise<Project> =>
    prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
      },
    }),

  delete: async (id: string): Promise<void> => {
    await prisma.project.delete({ where: { id } });
  },

  addMember: async (projectId: string, userId: string): Promise<void> => {
    await prisma.projectMember.create({ data: { projectId, userId } });
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  },

  isMember: async (projectId: string, userId: string): Promise<boolean> => {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return member !== null;
  },

  getTaskStats: async (projectId: string) => {
    const [total, byStatus, overdue] = await Promise.all([
      prisma.task.count({ where: { projectId } }),
      prisma.task.groupBy({ by: ['statusId'], where: { projectId }, _count: true }),
      prisma.task.count({ where: { projectId, dueDate: { lt: new Date() } } }),
    ]);

    const completedStatus = await prisma.taskStatus.findFirst({
      where: { projectId, name: 'COMPLETED' },
    });
    const completed = completedStatus
      ? await prisma.task.count({ where: { projectId, statusId: completedStatus.id } })
      : 0;

    return {
      total,
      completed,
      overdue,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      byStatus,
    };
  },
});
