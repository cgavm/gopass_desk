import { api } from './client';
import { Task, TaskComment, Subtask } from '@/types';

interface CreateTaskInput {
  title: string;
  description?: string;
  statusId: string;
  assigneeId?: string | null;
  priority?: string;
  tags?: string[];
  startDate?: string | null;
  dueDate?: string | null;
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  statusId?: string;
  assigneeId?: string | null;
  priority?: string;
  tags?: string[];
  startDate?: string | null;
  dueDate?: string | null;
}

interface MoveTaskInput {
  statusId: string;
  order: number;
}

export const tasksApi = {
  create: async (projectId: string, input: CreateTaskInput): Promise<Task> => {
    const { data } = await api.post<Task>(`/projects/${projectId}/tasks`, input);
    return data;
  },

  get: async (taskId: string): Promise<Task> => {
    const { data } = await api.get<Task>(`/tasks/${taskId}`);
    return data;
  },

  update: async (taskId: string, input: UpdateTaskInput): Promise<Task> => {
    const { data } = await api.patch<Task>(`/tasks/${taskId}`, input);
    return data;
  },

  move: async (taskId: string, input: MoveTaskInput): Promise<void> => {
    await api.patch(`/tasks/${taskId}/move`, input);
  },

  delete: async (taskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  // Comments
  addComment: async (
    taskId: string,
    content: string
  ): Promise<TaskComment> => {
    const { data } = await api.post<TaskComment>(
      `/tasks/${taskId}/comments`,
      { content }
    );
    return data;
  },

  getComments: async (taskId: string): Promise<TaskComment[]> => {
    const { data } = await api.get<{ data: TaskComment[] }>(
      `/tasks/${taskId}/comments`
    );
    return data.data;
  },

  // Subtasks
  addSubtask: async (taskId: string, title: string): Promise<Subtask> => {
    const { data } = await api.post<Subtask>(
      `/tasks/${taskId}/subtasks`,
      { title }
    );
    return data;
  },

  updateSubtask: async (
    taskId: string,
    subtaskId: string,
    input: { title?: string; isCompleted?: boolean }
  ): Promise<Subtask> => {
    const { data } = await api.patch<Subtask>(
      `/tasks/${taskId}/subtasks/${subtaskId}`,
      input
    );
    return data;
  },

  deleteSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  },

  // History
  getHistory: async (taskId: string) => {
    const { data } = await api.get(`/tasks/${taskId}/history`);
    return data.data;
  },
};
