import { z } from 'zod';

export const CreateMaterialSchema = z.object({
  tipo: z.enum(['flashcards', 'resumo', 'simulado', 'mapa_mental']),
  prompt: z.string().min(1, 'Instrução ou prompt é obrigatório').max(1000),
  numeroCards: z.enum(['menos', 'padrao', 'mais']).optional().default('padrao'),
  dificuldade: z.enum(['facil', 'medio', 'dificil']).optional().default('medio'),
});

export type CreateMaterialDto = z.infer<typeof CreateMaterialSchema>;
