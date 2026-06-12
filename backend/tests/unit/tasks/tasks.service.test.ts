import { jest } from '@jest/globals';
import { TasksService } from '@modules/tasks/tasks.service';
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
} as unknown as TasksRepository;

const mockNotifRepo = {
  findByUser: jest.fn(),
  findUnreadByUser: jest.fn(),
  create: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
} as unknown as NotificationsRepository;

const service = new TasksService(mockTaskRepo, mockNotifRepo);

describe('tasks.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create task history entry on create', async () => {
    const task = {
      id: 'task-1',
      title: 'Test',
      projectId: 'proj-1',
      assigneeId: null,
    };
    (mockTaskRepo.create as jest.Mock).mockResolvedValue(task);
    (mockTaskRepo.createHistory as jest.Mock).mockResolvedValue({});

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
    (mockTaskRepo.findById as jest.Mock).mockResolvedValue(existing);
    (mockTaskRepo.move as jest.Mock).mockResolvedValue({});
    (mockTaskRepo.createHistory as jest.Mock).mockResolvedValue({});

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
    (mockTaskRepo.findById as jest.Mock).mockResolvedValue(existing);
    (mockTaskRepo.move as jest.Mock).mockResolvedValue({});
    (mockTaskRepo.createHistory as jest.Mock).mockResolvedValue({});
    (mockNotifRepo.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

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
    (mockTaskRepo.findById as jest.Mock).mockResolvedValue(task);
    (mockTaskRepo.addComment as jest.Mock).mockResolvedValue(comment);
    (mockNotifRepo.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

    await service.addComment('task-1', 'user-3', { content: 'Hello' });

    expect(mockNotifRepo.create).toHaveBeenCalledTimes(2);
  });
});
