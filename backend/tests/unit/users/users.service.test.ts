import { jest } from '@jest/globals';
import { UsersService } from '@modules/users/users.service';
import { UsersRepository } from '@modules/users/users.repository';
import { ConflictError } from '@shared/errors/AppError';

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
} as unknown as UsersRepository;

const service = new UsersService(mockRepo);

describe('users.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ConflictError on duplicate email', async () => {
    (mockRepo.findByEmail as jest.Mock).mockResolvedValue({
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
    (mockRepo.findById as jest.Mock).mockResolvedValue(user);
    (mockRepo.deactivate as jest.Mock).mockResolvedValue({
      ...user,
      isActive: false,
    });

    const result = await service.deactivate('user-1');
    expect(result.isActive).toBe(false);
    expect(mockRepo.deactivate).toHaveBeenCalledWith('user-1');
  });
});
