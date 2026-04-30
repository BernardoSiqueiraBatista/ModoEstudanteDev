import { z } from 'zod';

export const listAppointmentsQueryDtoSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  orgId: z.string().uuid().optional(),
  doctorUserId: z.string().uuid().optional(),
});

export type ListAppointmentsQueryDto = z.infer<typeof listAppointmentsQueryDtoSchema>;
