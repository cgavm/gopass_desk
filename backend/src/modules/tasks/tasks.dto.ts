import { z } from 'zod';
import { TaskPriority } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  statusId: z.string().uuid('Invalid status ID'),
  assigneeId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  statusId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const moveTaskSchema = z.object({
  statusId: z.string().uuid('Invalid status ID'),
  order: z.number().int().min(0),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  isCompleted: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
