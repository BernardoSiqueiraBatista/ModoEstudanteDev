import { z } from 'zod';

const isoMessage = 'Use uma data ISO válida. Ex: 2026-03-10T09:00:00-03:00';

export const createAppointmentSchema = z
  .object({
    patientId: z.string().uuid(),
    doctorUserId: z.string().uuid(),
    orgId: z.string().uuid().nullable().optional(),
    startAt: z.string().datetime({ offset: true, message: isoMessage }),
    endAt: z.string().datetime({ offset: true, message: isoMessage }),
    source: z.enum(['manual', 'google']).default('manual'),
    type: z.enum(['consulta', 'urgencia', 'video', 'compromisso']).default('consulta'),
    description: z.string().max(5000).optional().nullable(),
    externalEventId: z.string().optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startAt).getTime();
    const end = new Date(data.endAt).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Datas inválidas.',
        path: ['startAt'],
      });
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endAt deve ser maior que startAt.',
        path: ['endAt'],
      });
    }
  });

export const listAppointmentsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  orgId: z.string().uuid().optional(),
  doctorUserId: z.string().uuid().optional(),
});

export const getAppointmentByIdSchema = z.object({
  id: z.string().uuid(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['scheduled', 'canceled', 'done', 'no_show']),
});

export const listWeeklyQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  orgId: z.string().uuid().optional(),
  doctorUserId: z.string().uuid().optional(),
});

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type ListAppointmentsQueryDto = z.infer<typeof listAppointmentsQuerySchema>;
export type GetAppointmentByIdDto = z.infer<typeof getAppointmentByIdSchema>;
export type UpdateAppointmentStatusDto = z.infer<typeof updateAppointmentStatusSchema>;
export type ListWeeklyQueryDto = z.infer<typeof listWeeklyQuerySchema>;