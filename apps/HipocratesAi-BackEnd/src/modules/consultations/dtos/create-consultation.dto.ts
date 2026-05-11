import { z } from 'zod';

export const createConsultationSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  doctorNotes: z.string().max(2000).optional(),
});

export type CreateConsultationDTO = z.infer<typeof createConsultationSchema>;
