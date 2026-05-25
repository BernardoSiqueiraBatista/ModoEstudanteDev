import { z } from 'zod';

export const ChatQuestionSchema = z.object({
  pergunta: z.string().min(1, 'A pergunta não pode estar vazia').max(2000, 'A pergunta é muito longa'),
});

export type ChatQuestionDto = z.infer<typeof ChatQuestionSchema>;
