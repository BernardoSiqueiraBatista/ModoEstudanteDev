import { z } from 'zod';

export const weeklyAppointmentsQueryDtoSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  orgId: z.string().uuid().optional(),
  doctorUserId: z.string().uuid().optional(),
});

export type WeeklyAppointmentsQueryDto = z.infer<typeof weeklyAppointmentsQueryDtoSchema>;
