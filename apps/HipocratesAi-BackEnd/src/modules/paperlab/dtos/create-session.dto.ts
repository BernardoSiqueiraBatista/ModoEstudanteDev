import { z } from 'zod';

export const CreateSessionSchema = z.object({
  titulo: z.string().max(255).optional().default('Untitled notebook'),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
