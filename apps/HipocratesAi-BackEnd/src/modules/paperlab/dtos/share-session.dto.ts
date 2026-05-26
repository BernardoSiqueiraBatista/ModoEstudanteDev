import { z } from 'zod';

export const ShareSessionSchema = z.object({
  visibilidade: z.enum(['link', 'privado']),
  expira_em: z.string().datetime().nullable().optional(),
});

export type ShareSessionDto = z.infer<typeof ShareSessionSchema>;
