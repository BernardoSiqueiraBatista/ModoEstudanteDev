import { z } from 'zod';

export const CreatePaperSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(500),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  conteudo_tipo: z.enum(['markdown', 'richtext', 'html']).default('markdown'),
  tags: z.array(z.string().max(100)).max(50).default([]),
  fonte_paperlab_id: z.string().uuid().nullable().optional(),
  status: z.enum(['rascunho', 'publicado']).default('rascunho'),
});

export type CreatePaperDto = z.infer<typeof CreatePaperSchema>;
