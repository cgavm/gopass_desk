import { jest } from '@jest/globals';
import { prisma } from '@infrastructure/database/prisma.client';

jest.mock('@infrastructure/database/prisma.client', () => ({
  prisma: {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    taskStatus: { findUnique: jest.fn() },
  },
}));

const mockedPrisma = prisma as any;
import { createTasksService } from '@modules/tasks/tasks.service';
import { TasksRepository } from '@modules/tasks/tasks.repository';
import { NotificationsRepository } from '@modules/notifications/notifications.repository';
import { ForbiddenError, NotFoundError } from '@shared/errors/AppError';

const mockTaskRepo = {
  findByProject: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  move: jest.fn(),
  createHistory: jest.fn(),
  getHistory: jest.fn(),
  addComment: jest.fn(),
  getComments: jest.fn(),
  addSubtask: jest.fn(),
  updateSubtask: jest.fn(),
  deleteSubtask: jest.fn(),
} as any;

const mockNotifRepo = {
  findByUser: jest.fn(),
  findUnreadByUser: jest.fn(),
  create: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
} as any;

const service = createTasksService(mockTaskRepo, mockNotifRepo);

describe('tasks.service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedPrisma.user.findUnique.mockResolvedValue({ name: 'Test User' });
    mockedPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);
    mockedPrisma.taskStatus.findUnique.mockResolvedValue({ name: 'New Status' });
  });

  it('should create task history entry on create', async () => {
    const task = {
      id: 'task-1',
      title: 'Test',
      projectId: 'proj-1',
      assigneeId: null,
    };
    (mockTaskRepo.create as any).mockResolvedValue(task);
    (mockTaskRepo.createHistory as any).mockResolvedValue({});

    await service.create('proj-1', 'user-1', 'ADMIN', {
      title: 'Test',
      statusId: 'status-1',
    });

    expect(mockTaskRepo.createHistory).toHaveBeenCalledWith(
      'task-1',
      'user-1',
      'task',
      null,
      'created'
    );
  });

  it('should update statusId and order on move', async () => {
    const existing = {
      id: 'task-1',
      statusId: 'old-status',
      status: { name: 'Backlog' },
      projectId: 'proj-1',
      title: 'Task',
      assigneeId: null,
    };
    (mockTaskRepo.findById as any).mockResolvedValue(existing);
    (mockTaskRepo.move as any).mockResolvedValue({});
    (mockTaskRepo.createHistory as any).mockResolvedValue({});

    await service.move('task-1', 'user-1', 'ADMIN', {
      statusId: 'new-status',
      order: 2,
    });

    expect(mockTaskRepo.move).toHaveBeenCalledWith('task-1', 'new-status', 2);
  });

  it('should prevent USER from deleting task', async () => {
    await expect(service.delete('task-1')).rejects.toThrow(NotFoundError);
  });

  it('should emit notification on status change when assignee exists', async () => {
    const existing = {
      id: 'task-1',
      statusId: 'old-status',
      status: { name: 'Backlog' },
      projectId: 'proj-1',
      title: 'Task',
      assigneeId: 'user-2',
      reporterId: 'user-1',
      project: { ownerId: 'user-1' },
    };
    (mockTaskRepo.findById as any).mockResolvedValue(existing);
    (mockTaskRepo.move as any).mockResolvedValue({});
    (mockTaskRepo.createHistory as any).mockResolvedValue({});
    (mockNotifRepo.create as any).mockResolvedValue({ id: 'notif-1' });

    await service.move('task-1', 'user-1', 'ADMIN', {
      statusId: 'new-status',
      order: 0,
    });

    expect(mockNotifRepo.create).toHaveBeenCalled();
  });

  it('should notify assignee and reporter on comment', async () => {
    const task = {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'Task',
      assigneeId: 'user-2',
      reporterId: 'user-1',
      project: { ownerId: 'user-1' },
    };
    const comment = { id: 'comment-1', content: 'Hello' };
    (mockTaskRepo.findById as any).mockResolvedValue(task);
    (mockTaskRepo.addComment as any).mockResolvedValue(comment);
    (mockNotifRepo.create as any).mockResolvedValue({ id: 'notif-1' });

    await service.addComment('task-1', 'user-3', { content: 'Hello' });

    expect(mockNotifRepo.create).toHaveBeenCalledTimes(3);
  });
  it('should find by project', async () => {
    (mockTaskRepo.findByProject as any).mockResolvedValue([{ id: '1' }]);
    const res = await service.findByProject('proj-1', 'user-1', 'ADMIN');
    expect(res).toHaveLength(1);
  });

  it('should find by id', async () => {
    (mockTaskRepo.findById as any).mockResolvedValue({ id: '1' });
    const res = await service.findById('1', 'user-1', 'ADMIN');
    expect(res.id).toBe('1');
  });

  it('should get comments', async () => {
    (mockTaskRepo.getComments as any).mockResolvedValue([{ id: 'c1' }]);
    const res = await service.getComments('1');
    expect(res).toHaveLength(1);
  });

  it('should add subtask', async () => {
    (mockTaskRepo.findById as any).mockResolvedValue({ id: '1', title: 'Task' });
    (mockTaskRepo.addSubtask as any).mockResolvedValue({ id: 's1' });
    const res = await service.addSubtask('1', 'user-1', { title: 'Sub' });
    expect(res.id).toBe('s1');
  });

  it('should update subtask', async () => {
    (mockTaskRepo.updateSubtask as any).mockResolvedValue({ id: 's1' });
    await service.updateSubtask('1', 's1', { title: 'Sub2' });
    expect(mockTaskRepo.updateSubtask).toHaveBeenCalled();
  });

  it('should delete subtask', async () => {
    (mockTaskRepo.deleteSubtask as any).mockResolvedValue({});
    await service.deleteSubtask('1', 's1');
    expect(mockTaskRepo.deleteSubtask).toHaveBeenCalled();
  });

  it('should update task', async () => {
    (mockTaskRepo.findById as any).mockResolvedValue({ id: '1', title: 'Task' });
    (mockTaskRepo.update as any).mockResolvedValue({ id: '1', title: 'Task2' });
    const res = await service.update('1', 'user-1', 'ADMIN', { title: 'Task2' });
    expect(res.title).toBe('Task2');
  });
});
