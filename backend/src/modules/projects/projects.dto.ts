import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
