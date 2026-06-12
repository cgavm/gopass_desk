export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string;
  owner: User;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  statuses: TaskStatus[];
  tasks?: Task[];
  _count?: { tasks: number };
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  joinedAt: string;
  user: User;
}

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  order: number;
  projectId: string;
  isDefault: boolean;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  statusId: string;
  projectId: string;
  assigneeId: string | null;
  reporterId: string;
  priority: TaskPriority;
  tags: string[];
  startDate: string | null;
  dueDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  assignee: Pick<User, 'id' | 'name'> | null;
  reporter: Pick<User, 'id' | 'name'>;
  status: TaskStatus;
  project?: Pick<Project, 'id' | 'name'>;
  subtasks: Subtask[];
  comments: TaskComment[];
  history: TaskHistoryEntry[];
  _count?: { comments: number };
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name'>;
}

export interface TaskHistoryEntry {
  id: string;
  taskId: string;
  userId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  user: Pick<User, 'id' | 'name'>;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'SUBTASK_CREATED';
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalProjects: number;
  totalTasks: number;
  totalUsers: number;
  activeUsers: number;
  tasksByStatus: Array<{ priority: string; _count: number }>;
  overdueTasks: number;
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    _count: { tasks: number };
  }>;
}
