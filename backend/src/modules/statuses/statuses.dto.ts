import { z } from 'zod';

export const createStatusSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be hex color').optional(),
  order: z.number().int().min(0).optional(),
});

export const updateStatusSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  order: z.number().int().min(0).optional(),
});

export const reorderStatusesSchema = z.object({
  statusIds: z.array(z.string().uuid()).min(1),
});

export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ReorderStatusesInput = z.infer<typeof reorderStatusesSchema>;
