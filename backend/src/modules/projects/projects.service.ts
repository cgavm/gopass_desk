import { UserRole, ProjectStatus } from '@prisma/client';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectInput, UpdateProjectInput, AddMemberInput } from './projects.dto';
import { ForbiddenError, NotFoundError, ConflictError } from '@shared/errors/AppError';
import { prisma } from '@infrastructure/database/prisma.client';
import { emitToAll } from '@infrastructure/sockets/socket.server';
import { SOCKET_EVENTS } from '@infrastructure/sockets/socket.events';

const DEFAULT_STATUSES = [
  { name: 'BACKLOG', color: '#6B7280', order: 0, isDefault: true },
  { name: 'IN_PROGRESS', color: '#3B82F6', order: 1, isDefault: false },
  { name: 'IN_REVIEW', color: '#F59E0B', order: 2, isDefault: false },
  { name: 'COMPLETED', color: '#10B981', order: 3, isDefault: false },
  { name: 'BLOCKED', color: '#EF4444', order: 4, isDefault: false },
];

// Minimal shape returned by ProjectsRepository.findById / findAll
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

export class ProjectsService {
  constructor(private readonly repository: ProjectsRepository) {}

  // Issue #1: All users see all projects (global board, like JIRA)
  async findAll(_userId: string, _userRole: UserRole): Promise<ProjectWithRelations[]> {
    return this.repository.findAll() as Promise<ProjectWithRelations[]>;
  }

  async findById(id: string, userId: string, userRole: UserRole): Promise<ProjectWithRelations> {
    const project = await this.repository.findById(id) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (userRole !== 'ADMIN' && !isOwner && !isMember) {
      throw new ForbiddenError('Access denied to this project');
    }

    return project;
  }

  async create(userId: string, input: CreateProjectInput): Promise<ProjectWithRelations> {
    // Use transaction to create project + default statuses + owner as member
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name: input.name,
          description: input.description,
          status: input.status ?? ProjectStatus.ACTIVE,
          ownerId: userId,
        },
      });

      // Create default task statuses
      await tx.taskStatus.createMany({
        data: DEFAULT_STATUSES.map((s) => ({
          ...s,
          projectId: newProject.id,
        })),
      });

      // Add owner as member
      await tx.projectMember.create({
        data: { projectId: newProject.id, userId },
      });

      return newProject;
    });

    const fullProject = await this.repository.findById(project.id) as ProjectWithRelations;

    // Issue #3: Emit PROJECT_CREATED to all connected users so every dashboard updates in real-time
    emitToAll(SOCKET_EVENTS.PROJECT_CREATED, { project: fullProject });

    return fullProject;
  }

  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    input: UpdateProjectInput
  ): Promise<ProjectWithRelations> {
    const project = await this.repository.findById(id) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    if (userRole !== 'ADMIN' && project.ownerId !== userId) {
      throw new ForbiddenError('Only owner or admin can update this project');
    }

    return this.repository.update(id, input) as Promise<ProjectWithRelations>;
  }

  async delete(id: string): Promise<void> {
    const project = (await this.repository.findById(id)) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    await this.repository.delete(id);
  }

  async addMember(
    id: string,
    userId: string,
    userRole: UserRole,
    input: AddMemberInput
  ): Promise<void> {
    const project = await this.repository.findById(id) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    if (userRole !== 'ADMIN' && project.ownerId !== userId) {
      throw new ForbiddenError('Only owner or admin can manage members');
    }

    const isMember = await this.repository.isMember(id, input.userId);
    if (isMember) {
      throw new ConflictError('User is already a member of this project');
    }

    await this.repository.addMember(id, input.userId);
  }

  async removeMember(
    id: string,
    memberUserId: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const project = await this.repository.findById(id) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    if (userRole !== 'ADMIN' && project.ownerId !== userId) {
      throw new ForbiddenError('Only owner or admin can manage members');
    }

    await this.repository.removeMember(id, memberUserId);
  }

  async getStats(id: string, userId: string, userRole: UserRole) {
    const project = await this.repository.findById(id) as ProjectWithRelations | null;
    if (!project) throw new NotFoundError('Project not found');

    const isMember = project.members.some((m) => m.userId === userId);
    if (userRole !== 'ADMIN' && project.ownerId !== userId && !isMember) {
      throw new ForbiddenError('Access denied');
    }

    return this.repository.getTaskStats(id);
  }
}
