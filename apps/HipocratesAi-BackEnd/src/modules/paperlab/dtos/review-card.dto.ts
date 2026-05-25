import { z } from 'zod';

export const ReviewCardSchema = z.object({
  cardId: z.string().uuid('ID do flashcard inválido'),
  resultado: z.enum(['acerto', 'erro']),
});

export type ReviewCardDto = z.infer<typeof ReviewCardSchema>;
