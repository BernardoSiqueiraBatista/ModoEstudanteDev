import { z } from 'zod';

export const UpdatePaperSchema = z.object({
  titulo: z.string().min(1).max(500).optional(),
  conteudo: z.string().min(1).optional(),
  conteudo_tipo: z.enum(['markdown', 'richtext', 'html']).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  status: z.enum(['rascunho', 'publicado']).optional(),
});

export type UpdatePaperDto = z.infer<typeof UpdatePaperSchema>;
