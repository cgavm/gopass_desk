import { jest } from '@jest/globals';
import { createUsersService } from '@modules/users/users.service';
import { UsersRepository } from '@modules/users/users.repository';
import { ConflictError } from '@shared/errors/AppError';

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
} as any;

const service = createUsersService(mockRepo);

describe('users.service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should find all users', async () => {
    (mockRepo.findAll as any).mockResolvedValue([{ id: '1' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find user by id', async () => {
    (mockRepo.findById as any).mockResolvedValue({ id: '1' });
    const result = await service.findById('1');
    expect(result).toBeDefined();
  });

  it('should create user successfully', async () => {
    (mockRepo.findByEmail as any).mockResolvedValue(null);
    (mockRepo.create as any).mockResolvedValue({ id: '1', role: 'USER' });
    const result = await service.create({ email: 'new@x.com', password: 'pass', name: 'Test', role: 'USER' });
    expect(result.id).toBe('1');
  });

  it('should update user successfully', async () => {
    (mockRepo.findById as any).mockResolvedValue({ id: '1', email: 'old@x.com' });
    (mockRepo.findByEmail as any).mockResolvedValue(null);
    (mockRepo.update as any).mockResolvedValue({ id: '1', email: 'new@x.com' });
    const result = await service.update('1', { email: 'new@x.com' });
    expect(result.email).toBe('new@x.com');
  });

  it('should throw ConflictError on duplicate email', async () => {
    (mockRepo.findByEmail as any).mockResolvedValue({
      id: 'existing-id',
      email: 'dup@example.com',
    });

    await expect(
      service.create({
        email: 'dup@example.com',
        password: 'pass123',
        name: 'Test',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should deactivate user without deleting from DB', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      isActive: true,
    };
    (mockRepo.findById as any).mockResolvedValue(user);
    (mockRepo.deactivate as any).mockResolvedValue({
      ...user,
      isActive: false,
    });

    const result = await service.deactivate('user-1');
    expect(result.isActive).toBe(false);
    expect(mockRepo.deactivate).toHaveBeenCalledWith('user-1');
  });
});
