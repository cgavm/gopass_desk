import bcrypt from 'bcryptjs';
import { logger } from '@shared/logger';
import { UsersRepository } from './users.repository';
import { CreateUserInput, UpdateUserInput } from './users.dto';
import { ConflictError, NotFoundError } from '@shared/errors/AppError';

export type UsersService = ReturnType<typeof createUsersService>;

export const createUsersService = (repository: UsersRepository) => ({
  findAll: () => repository.findAll(),

  findById: async (id: string) => {
    const user = await repository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  create: async (input: CreateUserInput) => {
    const existing = await repository.findByEmail(input.email);
    if (existing) {
      logger.warn({ email: input.email }, 'Attempt to create user with existing email');
      throw new ConflictError('Email already in use');
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await repository.create({ ...input, passwordHash });
    logger.info({ userId: user.id, role: user.role }, 'User created');
    return user;
  },

  update: async (id: string, input: UpdateUserInput) => {
    const current = await repository.findById(id);
    if (!current) throw new NotFoundError('User not found');

    if (input.email) {
      const existing = await repository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        logger.warn({ userId: id }, 'Email update conflict');
        throw new ConflictError('Email already in use');
      }
    }

    const user = await repository.update(id, input);
    logger.info({ userId: id }, 'User updated');
    return user;
  },

  deactivate: async (id: string) => {
    const current = await repository.findById(id);
    if (!current) throw new NotFoundError('User not found');
    const user = await repository.deactivate(id);
    logger.info({ userId: id }, 'User deactivated');
    return user;
  },
});
