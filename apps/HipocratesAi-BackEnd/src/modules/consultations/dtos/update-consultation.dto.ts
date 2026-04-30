import { z } from 'zod';

export const updateConsultationSchema = z.object({
  doctorNotes: z.string().max(10000).optional(),
  audioPath: z.string().max(500).optional(),
});

export type UpdateConsultationDTO = z.infer<typeof updateConsultationSchema>;
