import bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { CreateUserInput, UpdateUserInput } from './users.dto';
import { ConflictError, NotFoundError } from '@shared/errors/AppError';

export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async create(input: CreateUserInput) {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    return this.repository.create({ ...input, passwordHash });
  }

  async update(id: string, input: UpdateUserInput) {
    await this.findById(id); // ensure exists

    if (input.email) {
      const existing = await this.repository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ConflictError('Email already in use');
      }
    }

    return this.repository.update(id, input);
  }

  async deactivate(id: string) {
    await this.findById(id);
    return this.repository.deactivate(id);
  }
}
