import { logger } from '@shared/logger';
import { StatusesRepository } from './statuses.repository';
import { CreateStatusInput, UpdateStatusInput, ReorderStatusesInput } from './statuses.dto';
import { NotFoundError, BadRequestError } from '@shared/errors/AppError';

export type StatusesService = ReturnType<typeof createStatusesService>;

export const createStatusesService = (repository: StatusesRepository) => ({
  findByProject: (projectId: string) => repository.findByProject(projectId),

  create: async (projectId: string, input: CreateStatusInput) => {
    const status = await repository.create(projectId, input);
    logger.info({ projectId, statusId: status.id }, 'Status created');
    return status;
  },

  update: async (projectId: string, statusId: string, input: UpdateStatusInput) => {
    const status = await repository.findById(statusId);
    if (!status || status.projectId !== projectId) {
      throw new NotFoundError('Status not found in this project');
    }
    const updated = await repository.update(statusId, input);
    logger.info({ projectId, statusId }, 'Status updated');
    return updated;
  },

  delete: async (projectId: string, statusId: string) => {
    const status = await repository.findById(statusId);
    if (!status || status.projectId !== projectId) {
      throw new NotFoundError('Status not found in this project');
    }
    const taskCount = await repository.countTasksUsingStatus(statusId);
    if (taskCount > 0) {
      logger.warn({ statusId, taskCount }, 'Delete blocked: status has tasks');
      throw new BadRequestError('Cannot delete status with tasks. Move or delete tasks first.');
    }
    await repository.delete(statusId);
    logger.info({ projectId, statusId }, 'Status deleted');
  },

  reorder: async (projectId: string, input: ReorderStatusesInput) => {
    await repository.reorder(projectId, input.statusIds);
    logger.info({ projectId, count: input.statusIds.length }, 'Statuses reordered');
  },
});
