import { StatusesRepository } from './statuses.repository';
import { CreateStatusInput, UpdateStatusInput, ReorderStatusesInput } from './statuses.dto';
import { ForbiddenError, NotFoundError, BadRequestError } from '@shared/errors/AppError';

export class StatusesService {
  constructor(private readonly repository: StatusesRepository) {}

  async findByProject(projectId: string) {
    return this.repository.findByProject(projectId);
  }

  async create(projectId: string, input: CreateStatusInput) {
    return this.repository.create(projectId, input);
  }

  async update(
    projectId: string,
    statusId: string,
    input: UpdateStatusInput
  ) {
    const status = await this.repository.findById(statusId);
    if (!status || status.projectId !== projectId) {
      throw new NotFoundError('Status not found in this project');
    }
    return this.repository.update(statusId, input);
  }

  async delete(projectId: string, statusId: string) {
    const status = await this.repository.findById(statusId);
    if (!status || status.projectId !== projectId) {
      throw new NotFoundError('Status not found in this project');
    }

    const taskCount = await this.repository.countTasksUsingStatus(statusId);
    if (taskCount > 0) {
      throw new BadRequestError(
        'Cannot delete status with tasks. Move or delete tasks first.'
      );
    }

    return this.repository.delete(statusId);
  }

  async reorder(projectId: string, input: ReorderStatusesInput) {
    await this.repository.reorder(projectId, input.statusIds);
  }
}
