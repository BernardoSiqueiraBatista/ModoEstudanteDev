import { z } from 'zod';

export const researchSchema = z.object({
  query: z.string().min(3).max(500),
  includeWeb: z.boolean().optional(),
});

export type ResearchDto = z.infer<typeof researchSchema>;
