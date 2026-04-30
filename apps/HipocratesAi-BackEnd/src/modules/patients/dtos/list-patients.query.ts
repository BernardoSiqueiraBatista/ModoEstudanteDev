import { z } from 'zod';

export const listPatientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(200).optional(),
  tab: z.enum(['all', 'active', 'followup', 'critical']).default('all'),
});

export type ListPatientsQueryDto = z.infer<typeof listPatientsQuerySchema>;
