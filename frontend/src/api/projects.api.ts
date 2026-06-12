import { api } from './client';
import { Project, Task } from '@/types';

interface CreateProjectInput {
  name: string;
  description?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
}

interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const { data } = await api.get<{ data: Project[] }>('/projects');
    return data.data;
  },

  get: async (id: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  create: async (input: CreateProjectInput): Promise<Project> => {
    const { data } = await api.post<Project>('/projects', input);
    return data;
  },

  update: async (id: string, input: UpdateProjectInput): Promise<Project> => {
    const { data } = await api.patch<Project>(`/projects/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  addMember: async (projectId: string, userId: string): Promise<void> => {
    await api.post(`/projects/${projectId}/members`, { userId });
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  getStats: async (id: string) => {
    const { data } = await api.get(`/projects/${id}/stats`);
    return data;
  },

  getTasks: async (
    id: string,
    filters?: Record<string, string>
  ): Promise<Task[]> => {
    const { data } = await api.get<{ data: Task[] }>(`/projects/${id}/tasks`, {
      params: filters,
    });
    return data.data;
  },
};
