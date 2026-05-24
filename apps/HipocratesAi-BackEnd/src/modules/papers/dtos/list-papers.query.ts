import { z } from 'zod';

export const ListPapersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['rascunho', 'publicado']).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
});

export type ListPapersQuery = z.infer<typeof ListPapersQuerySchema>;
