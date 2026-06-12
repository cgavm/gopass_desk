import { UserRole, ProjectStatus } from '@prisma/client';
import { prisma } from '@infrastructure/database/prisma.client';
import { logger } from '@shared/logger';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectInput, UpdateProjectInput, AddMemberInput } from './projects.dto';
import { ForbiddenError, NotFoundError, ConflictError } from '@shared/errors/AppError';
import { emitToAll } from '@infrastructure/sockets/socket.server';
import { SOCKET_EVENTS } from '@infrastructure/sockets/socket.events';

const DEFAULT_STATUSES = [
  { name: 'BACKLOG', color: '#6B7280', order: 0, isDefault: true },
  { name: 'IN_PROGRESS', color: '#3B82F6', order: 1, isDefault: false },
  { name: 'IN_REVIEW', color: '#F59E0B', order: 2, isDefault: false },
  { name: 'COMPLETED', color: '#10B981', order: 3, isDefault: false },
  { name: 'BLOCKED', color: '#EF4444', order: 4, isDefault: false },
];

interface ProjectWithRelations {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{ userId: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export type ProjectsService = ReturnType<typeof createProjectsService>;

export const createProjectsService = (repository: ProjectsRepository) => ({
  findAll: (_userId: string, _userRole: UserRole): Promise<ProjectWithRelations[]> =>
    repository.findAll() as Promise<ProjectWithRelations[]>,

  findById: async (
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<ProjectWithRelations> => {
    const project = (await repository.findById(id)) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (userRole !== 'ADMIN' && !isOwner && !isMember) {
      logger.warn({ projectId: id, userId }, 'Access denied to project');
      throw new ForbiddenError('Access denied to this project');
    }

    return project;
  },

  create: async (
    userId: string,
    input: CreateProjectInput
  ): Promise<ProjectWithRelations> => {
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name: input.name,
          description: input.description,
          status: input.status ?? ProjectStatus.ACTIVE,
          ownerId: userId,
        },
      });

      await tx.taskStatus.createMany({
        data: DEFAULT_STATUSES.map((s) => ({ ...s, projectId: newProject.id })),
      });

      await tx.projectMember.create({
        data: { projectId: newProject.id, userId },
      });

      return newProject;
    });

    const fullProject = (await repository.findById(project.id)) as ProjectWithRelations;
    logger.info({ projectId: project.id, userId }, 'Project created');
    emitToAll(SOCKET_EVENTS.PROJECT_CREATED, { project: fullProject });
    return fullProject;
  },

  update: async (
    id: string,
    userId: string,
    userRole: UserRole,
    input: UpdateProjectInput
  ): Promise<ProjectWithRelations> => {
    const project = (await repository.findById(id)) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    if (userRole !== 'ADMIN' && project.ownerId !== userId) {
      logger.warn({ projectId: id, userId }, 'Unauthorized project update attempt');
      throw new ForbiddenError('Only owner or admin can update this project');
    }

    const updated = (await repository.update(id, input)) as unknown as ProjectWithRelations;
    logger.info({ projectId: id, userId }, 'Project updated');
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const project = (await repository.findById(id)) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');
    await repository.delete(id);
    logger.info({ projectId: id }, 'Project deleted');
  },

  addMember: async (
    id: string,
    userId: string,
    userRole: UserRole,
    input: AddMemberInput
  ): Promise<void> => {
    const project = (await repository.findById(id)) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    if (userRole !== 'ADMIN' && project.ownerId !== userId) {
      logger.warn({ projectId: id, userId }, 'Unauthorized member add attempt');
      throw new ForbiddenError('Only owner or admin can manage members');
    }

    const isMember = await repository.isMember(id, input.userId);
    if (isMember) throw new ConflictError('User is already a member of this project');

    await repository.addMember(id, input.userId);
    logger.info({ projectId: id, targetUserId: input.userId }, 'Member added to project');
  },

  removeMember: async (
    id: string,
    memberUserId: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> => {
    const project = (await repository.findById(id)) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    if (userRole !== 'ADMIN' && project.ownerId !== userId) {
      logger.warn({ projectId: id, userId }, 'Unauthorized member remove attempt');
      throw new ForbiddenError('Only owner or admin can manage members');
    }

    await repository.removeMember(id, memberUserId);
    logger.info({ projectId: id, targetUserId: memberUserId }, 'Member removed from project');
  },

  getStats: async (id: string, userId: string, userRole: UserRole) => {
    const project = (await repository.findById(id)) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    const isMember = project.members.some((m) => m.userId === userId);
    if (userRole !== 'ADMIN' && project.ownerId !== userId && !isMember) {
      logger.warn({ projectId: id, userId }, 'Access denied to project stats');
      throw new ForbiddenError('Access denied');
    }

    return repository.getTaskStats(id);
  },
});
