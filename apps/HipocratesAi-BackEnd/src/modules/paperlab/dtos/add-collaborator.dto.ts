import { z } from 'zod';

export const AddCollaboratorSchema = z.object({
  id_student: z.string().uuid('ID do estudante inválido'),
});

export type AddCollaboratorDto = z.infer<typeof AddCollaboratorSchema>;
